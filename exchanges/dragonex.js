var Dragonex = require("./base.js");
var util = require('../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../core/log');

// Helper methods
function joinCurrencies(currencyA, currencyB){
  return currencyA + '_' + currencyB;
}

var Trader = function(config) {
  _.bindAll(this);
  if(_.isObject(config)) {
    console.log(config.key)
    console.log(config.secret)
    this.key = config.key;
    this.secret = config.secret;
    this.currency = config.currency;
    this.asset = config.asset;
  }
  this.name = 'Dragonex';
  // this.balance;
  // this.price;

  this.pair = [this.currency, this.asset].join('_');

  this.dragonex = new Dragonex(this.key, this.secret);
}

// if the exchange errors we try the same call again after
// waiting 10 seconds
Trader.prototype.retry = function(method, args) {
  // var wait = +moment.duration(10, 'seconds');
  // log.debug(this.name, 'returned an error, retrying..');
  //
  // var self = this;
  //
  // // make sure the callback (and any other fn)
  // // is bound to Trader
  // _.each(args, function(arg, i) {
  //   if(_.isFunction(arg))
  //     args[i] = _.bind(arg, self);
  // });
  //
  // // run the failed method again with the same
  // // arguments after wait
  // setTimeout(
  //   function() { method.apply(self, args) },
  //   wait
  // );
}

Trader.prototype.getPortfolio = function(callback) {
  // var args = _.toArray(arguments);
  // var set = function(err, data) {
  //   if(err)
  //     return this.retry(this.getPortfolio, args);
  //
  //   var assetAmount = parseFloat( data[this.asset] );
  //   var currencyAmount = parseFloat( data[this.currency] );
  //
  //   if(
  //     !_.isNumber(assetAmount) || _.isNaN(assetAmount) ||
  //     !_.isNumber(currencyAmount) || _.isNaN(currencyAmount)
  //   ) {
  //     log.info('asset:', this.asset);
  //     log.info('currency:', this.currency);
  //     log.info('exchange data:', data);
  //     util.die('Gekko was unable to set the portfolio');
  //   }
  //
  //   var portfolio = [
  //     { name: this.asset, amount: assetAmount },
  //     { name: this.currency, amount: currencyAmount }
  //   ];
  //
  //   callback(err, portfolio);
  // }.bind(this);
  //
  // this.dragonex.myBalances(set);
}

Trader.prototype.getTicker = function(callback) {
  // var args = _.toArray(arguments);
  // this.dragonex.getTicker(function(err, data) {
  //   if(err)
  //     return this.retry(this.getTicker, args);
  //
  //   var tick = data[this.pair];
  //
  //   callback(null, {
  //     bid: parseFloat(tick.highestBid),
  //     ask: parseFloat(tick.lowestAsk),
  //   });
  //
  // }.bind(this));
}

Trader.prototype.getFee = function(callback) {
  // var set = function(err, data) {
  //   if(err || data.error)
  //     return callback(err || data.error);
  //
  //   callback(false, parseFloat(data.makerFee));
  // }
  // this.dragonex._private('returnFeeInfo', _.bind(set, this));
}

Trader.prototype.buy = function(volume, price, symbol_id) {
  // var args = _.toArray(arguments);
  // var set = function(err, result) {
  //   if(err || result.error) {
  //     log.error('unable to buy:', err, result);
  //     return this.retry(this.buy, args);
  //   }
  //
  //   callback(null, result.orderNumber);
  // }.bind(this);
  //
  // this.dragonex.buy(this.currency, this.asset, price, amount, set);

  Base.defaultHeader('POST', "/api/v1/order/sell/",{'symbol_id': symbol_id, 'price': price, 'volume': volume},(isTrue,response)=>{
  })
}

Trader.prototype.sell = function(volume, price, symbol_id) {
  // var args = _.toArray(arguments);
  // var set = function(err, result) {
  //   if(err || result.error) {
  //     log.error('unable to sell:', err, result);
  //     return this.retry(this.sell, args);
  //   }
  //
  //   callback(null, result.orderNumber);
  // }.bind(this);
  Base.defaultHeader('POST', "/api/v1/order/sell/",{'symbol_id': symbol_id, 'price': price, 'volume': volume},(isTrue,response)=>{
  })
  // this.dragonex.ge(this.currency, this.asset, price, amount, set);
}

Trader.prototype.checkOrder = function(order, callback) {
  // var check = function(err, result) {
  //   var stillThere = _.find(result, function(o) { return o.orderNumber === order });
  //   callback(err, !stillThere);
  // }.bind(this);
  //
  // this.dragonex.myOpenOrders(this.currency, this.asset, check);
}

Trader.prototype.getOrder = function(order, callback) {

  // var get = function(err, result) {
  //
  //   if(err)
  //     return callback(err);
  //
  //   var price = 0;
  //   var amount = 0;
  //   var date = moment(0);
  //
  //   if(result.error === 'Order not found, or you are not the person who placed it.')
  //     return callback(null, {price, amount, date});
  //
  //   _.each(result, trade => {
  //
  //     date = moment(trade.date);
  //     price = ((price * amount) + (+trade.rate * trade.amount)) / (+trade.amount + amount);
  //     amount += +trade.amount;
  //
  //   });
  //
  //   callback(err, {price, amount, date});
  // }.bind(this);
  //
  // this.dragonex.returnOrderTrades(order, get);
}

Trader.prototype.cancelOrder = function(order, callback) {
  // var args = _.toArray(arguments);
  // var cancel = function(err, result) {
  //
  //   // check if order is gone already
  //   if(result.error === 'Invalid order number, or you are not the person who placed the order.')
  //     return callback(true);
  //
  //   if(err || !result.success) {
  //     log.error('unable to cancel order', order, '(', err, result, '), retrying');
  //     return this.retry(this.cancelOrder, args);
  //   }
  //
  //   callback();
  // }.bind(this);
  //
  // this.dragonex.cancelOrder(this.currency, this.asset, order, cancel);
}

Trader.prototype.getTrades = function(since, callback, descending) {

}

Trader.getCapabilities = function () {
  return {
    name: 'Dragonex',
    slug: 'dragonex',
    currencies: ['USDT'],
    assets: [
      'BCT', 'BCH', 'ETH', 'LTC', 'NEO', 'QTUM', 'EOS', 'DT', 'SAFE', 'KNC',
      'ABT', 'LRC', 'CMT', 'RCN', 'CHT', 'MEET', 'SNET', 'TNB'
    ],
    markets: [

      // *** USDT <-> XXX
      { pair: ['USDT', 'BTC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'BCH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'ETH'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'LTC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'NEO'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'QTUM'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'EOS'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'DT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'SAFE'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'KNC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'ABT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'LRC'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'CMT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'RCN'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'CHT'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'MEET'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'SNET'], minimalOrder: { amount: 0.0001, unit: 'asset' } },
      { pair: ['USDT', 'TNB'], minimalOrder: { amount: 0.0001, unit: 'asset' } },

    ],
    requires: ['key', 'secret'],
    tid: 'tid',
    providesHistory: 'date',
    providesFullHistory: true,
    tradable: true
  };
}

module.exports = Trader;
