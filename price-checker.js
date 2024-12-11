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

let lastEthPrice = 0;
let lastEnoPrice = 0;

function formatPrice(current, last, symbol) {
    const formattedPrice = current.toFixed(18);
    if (last > 0) {
        const change = ((current - last) / last) * 100;
        const changeSymbol = change > 0 ? '↑' : change < 0 ? '↓' : '=';
        return `${symbol}: $${formattedPrice} ${changeSymbol} (${Math.abs(change).toFixed(8)}%)`;
    }
    return `${symbol}: $${formattedPrice}`;
}

async function getTokenPrice(provider, poolAddress, decimalDiff) {
    const poolContract = new ethers.Contract(poolAddress, POOL_V3_ABI, provider);
    const slot0 = await poolContract.slot0();
    const tick = Number(slot0.tick);
    
    const basePrice = Math.pow(1.0001, tick);
    return basePrice * Math.pow(10, decimalDiff);
}

async function monitorPrices() {
    const provider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    
    while (true) {
        try {
            const [ethPrice, enoPrice] = await Promise.all([
                getTokenPrice(provider, POOLS.ETH_USDT, 12),
                getTokenPrice(provider, POOLS.ENO_USDT, 12)
            ]);

            console.clear();
            console.log('\n=== Precios Actualizados ===');
            console.log(formatPrice(ethPrice, lastEthPrice, 'ETH'));
            console.log(formatPrice(enoPrice, lastEnoPrice, 'ENO'));
            console.log('\nTick data:');
            const ethSlot = await new ethers.Contract(POOLS.ETH_USDT, POOL_V3_ABI, provider).slot0();
            const enoSlot = await new ethers.Contract(POOLS.ENO_USDT, POOL_V3_ABI, provider).slot0();
            console.log('ETH tick:', Number(ethSlot.tick));
            console.log('ENO tick:', Number(enoSlot.tick));
            console.log('\nÚltima actualización:', new Date().toLocaleTimeString());
            
            lastEthPrice = ethPrice;
            lastEnoPrice = enoPrice;
            
        } catch (error) {
            console.error('Error al actualizar precios:', error);
        }
        
        // Esperar 60 segundos antes de la siguiente actualización
        await new Promise(resolve => setTimeout(resolve, 60000));
    }
}

// Iniciar el monitoreo
console.log('Iniciando monitoreo de precios...');
monitorPrices();