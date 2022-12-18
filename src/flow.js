const {
    getAccountInfo,
    getExchangeInfo,
    getOpenOrders,
    cancelOpenOrders,
    getCandles,
    createNewOrder,
} = require('./api')

function getTimeDifferenceInDays(date) {
    const differenceInMs = new Date() - new Date(date)

    return Math.floor(differenceInMs / (1000 * 60 * 60 * 24)) // 1000 * 60 * 60 * 24 milliseconds in a day
}

function getPortfolioItems() {
    return (
        process.env.ACC_PORTFOLIO &&
        JSON.parse(process.env.ACC_PORTFOLIO.replace(/\\/g, ''))
    )
}

async function checkAndCloseOpenBuyOrders() {
    const openOrders = await getOpenOrders()
    const openBuyOrders = openOrders.filter((order) => order.side === 'BUY')

    if (openBuyOrders.length) {
        const latestOpenBuyOrders = Object.values(
            openBuyOrders.reduce((orders, order) => {
                if (
                    !orders[order.symbol] ||
                    new Date(orders[order.symbol].time) < new Date(order.time)
                ) {
                    orders[order.symbol] = order
                }

                return orders
            }, {})
        )

        for (const order of latestOpenBuyOrders) {
            const orderAge = getTimeDifferenceInDays(order.time)

            if (orderAge >= process.env.ACC_ORDER_EXPIRE_DAYS) {
                await cancelOpenOrders(order.symbol)
            }
        }

        return
    }
}

async function getAccountBalance() {
    const accountInfo = await getAccountInfo()

    return Number(
        accountInfo.balances.find(
            (balance) => balance.asset === process.env.ACC_CURRENCY
        ).free
    )
}

async function getExchangeInfoForSymbol(symbol) {
    const exchangeInfo = await getExchangeInfo({ symbol })

    return exchangeInfo.symbols[0].filters.reduce((filters, filter) => {
        if (filter.filterType === 'PRICE_FILTER') {
            filters.minPrice = filter.minPrice
            filters.maxPrice = filter.maxPrice
            filters.tickSize = filter.tickSize
        }

        if (filter.filterType === 'LOT_SIZE') {
            filters.minQty = filter.minQty
            filters.maxQty = filter.maxQty
            filters.stepSize = filter.stepSize
        }

        return filters
    }, {})
}

const toFixedWithoutRounding = (floatNumber, precision) => {
    const factor = Math.pow(10, precision)

    return Math.floor(floatNumber * factor) / factor
}

const roundStep = (floatNumber, stepSize) => {
    const precision = stepSize.split('.')[1].indexOf('1') + 1

    return toFixedWithoutRounding(floatNumber, precision)
}

async function createOrders(portfolioItems, accountBalance) {
    const availableBalanceFiat = accountBalance * 0.9

    for (const portfolioItem of portfolioItems) {
        const { ticker, alloc } = portfolioItem

        const candles = await getCandles(ticker, '1m', { limit: 1 })

        if (!candles.length) {
            return
        }

        const coinPrice = candles[0].close
        const allocFiat = availableBalanceFiat * alloc
        const positionSizeFiat = allocFiat / 2

        const { stepSize, tickSize } = await getExchangeInfoForSymbol(ticker)

        const posSizeCoin = roundStep(positionSizeFiat / coinPrice, stepSize)
        const limitOrderPrice = roundStep(
            (coinPrice * (100 - process.env.ACC_LIMIT_ORDER_PERCENTAGE)) / 100,
            tickSize
        )

        await createNewOrder(
            ticker,
            'BUY',
            'MARKET',

            {
                quantity: posSizeCoin,
            }
        )

        await createNewOrder(
            ticker,
            'BUY',
            'LIMIT',

            {
                price: limitOrderPrice,
                quantity: posSizeCoin,
                timeInForce: 'GTC',
            }
        )
    }
}

async function flow() {
    console.log('flow')

    // get portfolio items
    const portfolioItems = getPortfolioItems()

    if (!portfolioItems.length) {
        return
    }

    // get open orders, close expired orders
    await checkAndCloseOpenBuyOrders()

    // get account info
    const accountBalance = await getAccountBalance()

    if (accountBalance < process.env.ACC_MIN_BALANCE) {
        return
    }

    // check signal
    const signal = false

    if (signal) {
        await createOrders(portfolioItems, accountBalance)
    } else {
        return
    }
}

exports.flow = flow
