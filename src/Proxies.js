import request from 'superagent'
import proxy from 'superagent-proxy'
import Debug from 'debug'
import cheerio from 'cheerio'
import _ from 'lodash'
import qs from 'qs'
import ms from 'ms'
import validateip from 'validate-ip'
import phantom from 'co-phantom'
const debug = Debug('proxies')
const freeUrl = 'http://www.freeproxylists.net/'
export default class Watcher {
  constructor(){
  }
  *init(){
    if(!this.phantom)
    this.phantom = yield phantom.create()
  }
  *getHtml(url){
    yield this.init()
    let page = yield this.phantom.createPage()
    let wait =  page.wait('loadFinished');
    yield page.open(url)
    yield wait;
    let html = yield page.evaluate(()=>{
      return document.body.innerHTML;
    })
    return html
  }
  *getfreeproxylist(options){
    options = options || {}
    let opts = {
      c: options.country||'US'
      , pr: options.protocol||'HTTP'
      , u: options.reliability||30
      , a: options.anonlevel||[0, 1, 2]
    }
    let url = `${freeUrl}?${qs.stringify(opts)}`
    debug(url)
    let html = yield this.getHtml(url)
    let $ = cheerio.load(html)
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
  *getRandomProxy(){
    if(!this.proxies)
    this.proxies = yield this.getfreeproxylist()
    return _.sample(this.proxies)
  }
} 