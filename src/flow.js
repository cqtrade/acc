const {
    getAccountInfo,
    getOpenOrders,
    cancelOpenOrders,
    getCandles,
} = require('./api')

function getTimeDifferenceInDays(date) {
    const differenceInMs = new Date() - new Date(date)

    return Math.floor(differenceInMs / (1000 * 60 * 60 * 24))
}

async function flow() {
    console.log('flow')
    const portfolioItems =
        process.env.ACC_PORTFOLIO &&
        JSON.parse(process.env.ACC_PORTFOLIO.replace(/\\/g, ''))

    console.log('portfolioItems', portfolioItems)

    if (!portfolioItems.length) {
        return
    }

    const openOrders = await getOpenOrders()

    console.log('openOrders', openOrders)

    if (openOrders.length) {
        const orderAge = getTimeDifferenceInDays(openOrders[0].time)

        if (orderAge >= process.env.ACC_ORDER_EXPIRE_DAYS) {
            console.log('orderAge exeeded, cancelOpenOrders')
            await cancelOpenOrders('BNBUSDT')
        } else {
            return
        }
    }

    const accountInfo = await getAccountInfo()

    const balance = Number(
        accountInfo.balances.find((balance) => balance.asset === 'USDT').free
    )

    console.log('balance', balance)

    if (balance < process.env.ACC_MIN_BALANCE) {
        return
    }

    const signal = true

    if (signal) {
        const availableBalance = balance * 0.9

        const candles = await getCandles('BTCUSDT', '1m', { limit: 1 })

        console.log('candles', candles)
        const coinPrice = candles[0].close

        // WIP
    } else {
        return
    }
}

exports.flow = flow
