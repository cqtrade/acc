const { getCandles } = require('./api')

const mean = coll =>
    coll.reduce(
        (acc, curr) =>
            acc + (curr.rocp || curr.close || curr),
        0)
    / coll.length

const sma = (period, coll) =>
    coll.map((d, i) =>
        i < period
            ? Object.assign(d, { sma: null })
            : Object.assign(
                d,
                { rocp_sma: mean(coll.slice((i + 1) - period, (i + 1))) }))

/**
 * 100 * (value_0 - value_n) / value_n
 * @param {*} period 
 * @param {*} coll 
 * @returns 
 */
const rocp = (period, coll) =>
    coll.map((d, i) =>
        i < period
            ? Object.assign(d, { rocp: null })
            : Object.assign(
                d,
                {
                    rocp: 100 * (d.close - coll[i - period].close)
                        / coll[i - period].close
                }))

async function getSignals() {
    const rocPeriod = process.env.ACC_ROCP || 24
    const rocsmaPeriod = process.env.ACC_SMA || 5
    const rocsmaLevel = -3.0
    const coll = await getCandles('BTCUSDT', '1h', { limit: 1000 })
    const wROCPSMA = sma(rocsmaPeriod, rocp(rocPeriod, coll))

    return wROCPSMA.map((d, i, a) => {
        if (!i) { return Object.assign(d, { isBuy: false }) }
        if (a[i - 1].rocp_sma
            && a[i - 1].rocp_sma < rocsmaLevel
            && d.rocp_sma > a[i - 1].rocp_sma) {
            return Object.assign(d, { isBuy: true })
        }
        return Object.assign(d, { isBuy: false })
    })
}

async function checkSignal() {
    const coll = await getSignals()
    return coll[coll.length - 1].isBuy
}

exports.checkSignal = checkSignal

// console.log('###############')
// console.log('###############')
// console.log('###############')
// getSignals().then(coll => console.log(coll.filter(item => !!item.isBuy)))
// checkSignal().then(s => console.log(s))
