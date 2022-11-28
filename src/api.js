const { Spot } = require('@binance/connector')

const apiKey = process.env.ACC_API_KEY
const apiSecret = process.env.ACC_API_SECRET

const client = new Spot(apiKey, apiSecret)

async function getAccountInfo() {
    const res = await client.account()
    console.log(res)
}

/**
 * 
 * Kline/Candlestick Data<br>
 *
 * GET /api/v3/klines<br>
 * 
 * Intervals: 
 * 1s
 * 1m
 * 3m
 * 5m
 * 15m
 * 30m
 * 1h
 * 2h
 * 4h
 * 6h
 * 8h
 * 12h
 * 1d
 * 3d
 * 1w
 * 1M
 * 
 * limit: Default 500; max 1000
 * 
 * {@link https://binance-docs.github.io/apidocs/spot/en/#kline-candlestick-data}
 */
async function getCandles(symbol, interval, opts) {
    try {
        const { data } = await client.klines(symbol, interval, opts)
        return data.map(d => ({
            startTime: d[0],
            startTimeString: new Date(d[0]),
            open: Number(d[1]),
            high: Number(d[2]),
            low: Number(d[3]),
            close: Number(d[4]),
            volume: Number(d[5]),
            endTime: d[6],
            endTimeString: new Date(d[6]),
        }))
    } catch (error) {
        console.log('ERROR getCandles', error)
        throw error
    }
}

exports.getCandles = getCandles
