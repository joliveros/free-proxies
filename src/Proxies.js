import 'babel-polyfill'
import Debug from 'debug'
import cheerio from 'cheerio'
import _ from 'lodash'
import qs from 'qs'
import validateip from 'validate-ip'
import driver from 'node-phantom-promise'
import phantomjs from 'phantomjs'
import Redis from 'redis'
import coredis from 'co-redis'
let {
  path
} = phantomjs
let redis = coredis(Redis.createClient())
const proxyReg = /^proxy\:(.+)/
const keyprefix = 'proxy'
const debug = Debug('proxies')
const freeUrl = 'http://www.freeproxylists.net/'
const usproxiesUrl = 'http://www.us-proxy.org/'
export default class Proxies {
  constructor(){
  }
  async init(){
    if(!this.phantom)
    this.phantom = await driver.create({path})
  }
  async getHtml(url){
    await this.init()
    let page = await this.phantom.createPage()
    await page.open(url)
    let html = await page.evaluate(()=>{
      return document.body.innerHTML;
    })
    return html
  }
  async getUSProxies(){
    let html = await this.getHtml(usproxiesUrl)
    let $ = cheerio.load(html)
    let rows = $('#proxylisttable tr').toArray()
    rows = _.map(rows, row=>{
      row = $(row)
      let tds = row.find('td').toArray()
      tds = _.map(tds, td=>{
        if(!td)return;
        return $(td).html()
      })
      let [ip, port, country, anonymity, google, https, last] = tds
      if(!ip)return;
      row = `${https=='yes'?'https':'http'}://${ip}:${port}`
      return row
    })
    rows = _.filter(rows, row=>{
      return !_.isUndefined(row)
    })
    return rows
  }
  async getfreeproxylist(options){
    options = options || {}
    let opts = {
      c: options.country||'US'
      , pr: options.protocol||'HTTP'
      , u: options.reliability||30
      , a: options.anonlevel||[0, 1, 2]
    }
    let url = `${freeUrl}?${qs.stringify(opts)}`
    debug(url)
    let html = await this.getHtml(url)
    let $ = cheerio.load(html)
    // debug(html)
    let rows = $('.DataGrid tr').toArray()
    // debug(rows)
    let ips = _.map(rows, a=>{
      a = $(a)
      let ip = a.find('script').first().html()
      if(!ip)return;
      ip = ip.match(/\"([^\"]+)\"/)
      if(!ip)return;
      ip = decodeURIComponent(ip)
      ip = ip.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)
      if(!ip)return;
      ip = ip[0]
      if(!validateip(ip))return;
      let port = a.find('td:nth-child(2)').first().html()
      ip = `${opts.pr.toLowerCase()}://${ip}:${port}`
      return ip
    })
    ips = _.filter(ips, ip=>{
      return ip!=undefined
    })
    return ips
  }
  async getAllProxies(){
    let proxies = await this.getfreeproxylist()
    let usproxies = await this.getUSProxies()
    proxies = proxies.concat(usproxies)
    debug(proxies)
    return await this.saveProxies(proxies)
  }
  async _getProxies(){
    let proxies =  await redis.keys(`${keyprefix}:\*`)
    proxies = _.map(proxies, p=>{
      return p.match(proxyReg)[1]
    })
    return proxies
  }
  async getRandomProxy(){
    let proxies = await this._getProxies()
    if(proxies.length==0){
      await this.getAllProxies()
    }
    proxies = await this._getProxies()
    return _.sample(proxies)
  }
  async removeProxy(key){
    await redis.del(key)
  }
  async saveProxies(proxies){
    if(!_.isArray(proxies)) throw new Error('requires array of proxies.')
    let keys = []
    proxies.forEach((proxy) => {
      // proxy:http://0.0.0.0:9090
      let key = `${keyprefix}:${proxy}`
      redis.set(key, '')
      keys.push(key)
    })
    return keys
  }
}
