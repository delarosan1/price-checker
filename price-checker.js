const ethers = require('ethers');

// ABI para Uniswap V3
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

// Direcciones de pools V3
const POOLS = {
    ETH_USDT: '0x641C00A822e8b671738d32a431a4Fb6074E5c79d',
    ENO_USDT: '0xe5ba76eb3d51f523c80ec6af77c46d0aca82f3e0'
};

async function getTokenPrice(provider, poolAddress, decimalDiff) {
    const poolContract = new ethers.Contract(poolAddress, POOL_V3_ABI, provider);
    const slot0 = await poolContract.slot0();
    const tick = Number(slot0.tick);
    
    const basePrice = Math.pow(1.0001, tick);
    const price = basePrice * Math.pow(10, decimalDiff);
    
    return price;
}

async function main() {
    const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    
    try {
        const [ethPrice, enoPrice] = await Promise.all([
            getTokenPrice(provider, POOLS.ETH_USDT, 12), // WETH(18) - USDT(6) = 12
            getTokenPrice(provider, POOLS.ENO_USDT, 12)  // ENO(18) - USDT(6) = 12
        ]);
        
        console.log(`ETH: $${ethPrice.toFixed(2)}`);
        console.log(`ENO: $${enoPrice.toFixed(8)}`);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();