import { expect } from 'chai'
import Module from './Proxies.js'
import _ from 'lodash'
import Debug from 'debug'
import ms from 'ms'

let debug = Debug('test')
let module = new Module()
describe('#getHtml',function(){
  this.timeout(ms('15s'))
  it('should return html', function*(){
    let html = yield module.getHtml('http://www.freeproxylists.net')
    expect(html).to.match(/\<div/)
  })
})
describe('#getfreeproxylist',function(){
  this.timeout(ms('15s'))
  it('should return urls', function*(){
    let res = yield module.getfreeproxylist()
    expect(res).to.be.array
    expect(_.first(res)).to.match(/http\:\/\//)
  })
})
describe('#getRandomProxy',function(){
  this.timeout(ms('15s'))
  it('should return urls', function*(){
    let res = yield module.getRandomProxy()
    debug(res)
    expect(res).to.match(/http\:\/\//)
  })
})