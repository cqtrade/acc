const { Spot } = require('@binance/connector')

const apiKey = process.env.ACC_API_KEY
const apiSecret = process.env.ACC_API_SECRET

const client = new Spot(apiKey, apiSecret)

async function getAccountInfo() {
    const res = await client.account()
    console.log(res)
}

async function getCandles() {
    try {
        const res = await client.klines('BTCUSDT', '1h')
        console.log(res)
    } catch (error) {
        console.log('ERROR', error)
    }
}

// getCandles().then()
