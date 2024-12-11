const ethers = require('ethers');

// ABI para Uniswap V2 (ETH/USDT)
const PAIR_ABI = [
    {
        "constant": true,
        "inputs": [],
        "name": "getReserves",
        "outputs": [
            { "internalType": "uint112", "name": "_reserve0", "type": "uint112" },
            { "internalType": "uint112", "name": "_reserve1", "type": "uint112" },
            { "internalType": "uint32", "name": "_blockTimestampLast", "type": "uint32" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "token0",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    }
];

// ABI para Uniswap V3 (ENO/USDT)
const POOL_V3_ABI = [
    {
        "inputs": [],
        "name": "slot0",
        "outputs": [
            { "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160" },
            { "internalType": "int24", "name": "tick", "type": "int24" },
            { "internalType": "uint16", "name": "observationIndex", "type": "uint16" },
            { "internalType": "uint16", "name": "observationCardinality", "type": "uint16" },
            { "internalType": "uint16", "name": "observationCardinalityNext", "type": "uint16" },
            { "internalType": "uint8", "name": "feeProtocol", "type": "uint8" },
            { "internalType": "bool", "name": "unlocked", "type": "bool" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Direcciones de contratos
const POOLS = {
    ETH_USDT: '0x905dfCD5649217c42684f23958568e533C711Aa3',
    ENO_USDT: '0xe5ba76eb3d51f523c80ec6af77c46d0aca82f3e0'
};

async function getEthPrice(provider) {
    const poolContract = new ethers.Contract(POOLS.ETH_USDT, PAIR_ABI, provider);
    const [reserves, token0] = await Promise.all([
        poolContract.getReserves(),
        poolContract.token0()
    ]);
    
    const WETH = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'.toLowerCase();
    const isWethToken0 = token0.toLowerCase() === WETH;
    
    const ethReserve = BigInt(isWethToken0 ? reserves[0] : reserves[1]);
    const usdtReserve = BigInt(isWethToken0 ? reserves[1] : reserves[0]);
    
    const price = Number((usdtReserve * (BigInt(10) ** BigInt(18))) / 
                        (ethReserve * (BigInt(10) ** BigInt(6))));
    return price;
}

async function getEnoPrice(provider) {
    const poolContract = new ethers.Contract(POOLS.ENO_USDT, POOL_V3_ABI, provider);
    const slot0 = await poolContract.slot0();
    const tick = Number(slot0.tick);
    
    const basePrice = Math.pow(1.0001, tick);
    const price = basePrice * Math.pow(10, 12); // Ajuste por diferencia de decimales (18 - 6)
    
    return price;
}

async function main() {
    const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    
    try {
        const [ethPrice, enoPrice] = await Promise.all([
            getEthPrice(provider),
            getEnoPrice(provider)
        ]);
        
        console.log(`ETH: $${ethPrice.toFixed(2)}`);
        console.log(`ENO: $${enoPrice.toFixed(8)}`);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();