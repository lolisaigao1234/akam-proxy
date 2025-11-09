const request = require('superagent')
const cheerio = require('cheerio')
const json5 = require('json5')
const { retry } = require('async')


function chinazPing (host, options) {
    return new Promise((resolve, reject) => {
        request.get('https://ping.chinaz.com/' + host)
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        .set('Referer', 'https://ping.chinaz.com/')
        .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
        .set('Accept-Language', 'en-US,en;q=0.9')
        .then(res => {
            const $ = cheerio.load(res.text)
            const enkey = $('#enkey').val()
            const serverList = $('#speedlist .listw')

            console.log(`chinaz servers count: ${serverList.length}`)

            const taskList = []

            serverList.each((i, elem) => {
                const guid = $(elem).attr('id')
                const task = new Promise((childResolve) => {
                    retry(
                        { times: options.retryTime, interval: options.waittingInterval },
                        (retry_callback) => {
                            request.post('https://ping.chinaz.com/iframe.ashx?t=ping')
                                .type('form')
                                .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
                                .set('Referer', 'https://ping.chinaz.com/' + host)
                                .set('Accept', '*/*')
                                .set('X-Requested-With', 'XMLHttpRequest')
                                .send({
                                    guid,
                                    host: host,
                                    ishost: 0,
                                    isipv6: 0,
                                    checktype: 0,
                                    encode: enkey,
                                })
                                .then(res => {
                                    const resReg = res.text.match(/^\((.*)\)$/)
                                    const data = (resReg)? json5.parse(resReg[1]) : {}
                                    retry_callback((data.state != 1)? 'pending' : null, data)
                                })
                                .catch(err => {
                                    retry_callback(err)
                                })
                        }
                    )
                    .then(childResolve)
                    .catch(childResolve)
                })
                taskList.push(task)
            })

            Promise.all(taskList)
            .then(resluts => {
                resolve(
                    resluts
                    .filter(item => item.state == 1)
                    .map(item => item.result.ip)
                )
            })
        })
        .catch(reject)
    })
}

module.exports = chinazPing