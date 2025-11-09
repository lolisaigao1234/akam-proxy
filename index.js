const proxy = require('./libs/proxy')
const fs = require('fs')
const getGoodServer = require('./utils/getGoodServer')
require('json5/lib/register')
const config = require('./config.json5')

const ipListText = fs.readFileSync('ip_list.txt', 'utf-8')
let ipList = ipListText.split(/\r\n|\r|\n/).filter(item => !!item && !/\:/.test(item))

console.log(`Loaded ${ipList.length} IP addresses from ip_list.txt`)
console.log(`To update IPs manually, use: nslookup ${config.host}`)

let best = {host: ipList[0], avg: Number.MAX_SAFE_INTEGER, originalHost: config.host}

function refreshBest(ipList) {
    console.log('Pinging ipList')
    getGoodServer(ipList)
    .then(goodList => {
        if(goodList.length) {
            best.host = goodList[0].host
            best.avg = goodList[0].avg
            console.log(`The best server is ${best.host} which delay is ${best.avg}ms`)
        } else {
            console.log(`Could not find any available server`)
        }
    })
}

// Initial server selection
refreshBest(ipList)

// Periodically re-test and select the best server
setInterval(() => refreshBest(ipList), config.refreshInterval * 1000)

proxy(best, config.port)
