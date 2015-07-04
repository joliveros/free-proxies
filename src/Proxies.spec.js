import { expect } from 'chai'
import Module from './Proxies.js'
import _ from 'lodash'
import Debug from 'debug'
import ms from 'ms'
import foreach from 'generator-foreach'
let _proxies = [ 
  'http://108.61.200.66:8080'
  , 'http://65.79.168.42:80'
  , 'http://208.53.164.114:80'
  , 'http://108.61.127.84:8080'
]
let debug = Debug('test')
let module = new Module()
describe('#getHtml',function(){
  this.timeout(ms('15s'))
  it('should return html', function*(){
    let html = yield module.getHtml('http://www.freeproxylists.net')
    // debug(html)
    expect(html).to.match(/\<div/)
  })
})
describe('#getfreeproxylist',function(){
  this.timeout(ms('15s'))
  it('should return urls', function*(){
    let res = yield module.getfreeproxylist()
    debug(res)
    expect(res).to.be.array
    expect(_.first(res)).to.match(/http\:\/\//)
  })
})
describe('#_getProxies',function(){
  this.timeout(ms('20s'))
  it('should return urls', function*(){
    let res = yield module._getProxies()
    debug(res)
    expect(_.first(res)).to.match(/http\:\/\//)
  })
})
describe('#getRandomProxy',function(){
  this.timeout(ms('20s'))
  it('should return urls', function*(){
    let res = yield module.getRandomProxy()
    debug(res)
    expect(res).to.match(/http\:\/\//)
  })
})
describe('#saveProxies',function(){
  this.timeout(ms('20s'))
  it('should save proxies to redis', function*(){
    let proxies = _proxies
    debug(proxies)
    yield module.saveProxies(proxies)
  })
})
describe('#removeProxy',function(){
  this.timeout(ms('15s'))
  it('should remove proxy from redis', function*(){
    let proxies = _proxies
    let keys = yield module.saveProxies(proxies)
    yield* foreach(keys, function*(key){
      yield* module.removeProxy(key)
    })
  })
})
describe('#getUSProxies',function(){
  this.timeout(ms('15s'))
  it('should return urls', function*(){
    let res = yield module.getUSProxies()
    expect(res).to.be.array
    debug(_.first(res))
    expect(_.first(res)).to.match(/https*\:\/\//)
  })
})
describe('#getAllProxies',function(){
  this.timeout(ms('15s'))
  it('should return urls', function*(){
    let res = yield module.getAllProxies()
    debug(res)
  })
})