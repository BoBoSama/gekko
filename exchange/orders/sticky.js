/*
  The sticky order is an advanced order:
    - It is created at max price X
      - if limit is not specified always at bbo.
      - if limit is specified the price is either limit or the bbo (whichever is comes first)
    - it will readjust the order:
      - if overtake is true it will overbid the current bbo <- TODO
      - if overtake is false it will stick to current bbo when this moves
    - If the price moves away from the order it will stay at the top


  TODO:
    - specify move behaviour (create new one first and cancel old order later?)
    - native move
    - if overtake is true it will overbid the current bbo
*/

const _ = require('lodash');
const async = require('async');
const events = require('events');
const moment = require('moment');
const errors = require('../exchangeErrors');
const BaseOrder = require('./order');
const states = require('./states');

class StickyOrder extends BaseOrder {
  constructor(api) {
    super(api);

    // global async lock
    this.sticking = false;
  }

  create(side, rawAmount, params = {}) {
    this.side = side;

    this.amount = this.api.roundAmount(rawAmount);

    if(side === 'buy') {
      if(params.limit)
        this.limit = this.api.roundPrice(params.limit);
      else
        this.limit = Infinity;
    } else {
      if(params.limit)
        this.limit = this.api.roundPrice(params.limit);
      else
        this.limit = -Infinity;
    }

    this.status = states.SUBMITTED;
    this.emitStatus();

    this.orders = {};

    // note: currently always sticks to max BBO, does not overtake
    if(side === 'buy')
      this.price = Math.min(this.data.ticker.bid, this.limit);
    else
      this.price = Math.max(this.data.ticker.ask, this.limit);

    this.submit();

    return this;
  }

  submit() {
    const alreadyFilled = this.calculateFilled();
    const amount = this.amount - alreadyFilled;

    if(amount < this.data.market.minimalOrder.amount) {
      if(!alreadyFilled) {
        // We are not partially filled, meaning the
        // amount passed was too small to even start.
        throw new Error('Amount is too small');
      }

      // partially filled, but the remainder is too
      // small.
      return this.finish();
    }

    this.api[this.side](amount, this.price, this.handleCreate);
  }

  handleCreate(err, id) {
    if(err)
      throw err;

    // potentailly clean up old order
    if(
      this.id &&
      this.orders[this.id] &&
      !this.orders[this.id].filled
    )
      delete this.orders[this.id];

    this.id = id;
    this.orders[id] = {
      price: this.price,
      filled: 0
    }

    this.status = states.OPEN;
    this.emitStatus();

    this.sticking = false;

    if(this.movingLimit)
      return this.moveLimit();

    if(this.movingAmount)
      return this.moveAmount();

    if(this.cancelling)
      return this.cancel();

    this.timeout = setTimeout(this.checkOrder, this.checkInterval);
  }

  checkOrder() {
    this.sticking = true;

    this.api.checkOrder(this.id, (err, result) => {
      if(err)
        throw err;

      if(result.open) {
        if(result.filledAmount !== this.orders[this.id].filled) {
          this.orders[this.id].filled = result.filledAmount;

          // note: doc event API
          this.emit('partialFill', this.calculateFilled());
        }

        // if we are already at limit we dont care where the top is
        // note: might be string VS float
        if(this.price == this.limit) {
          this.timeout = setTimeout(this.checkOrder, this.checkInterval);
          this.sticking = false;
          return;
        }

        this.api.getTicker((err, ticker) => {
          if(err)
            throw err;

          let top;
          if(this.side === 'buy')
            top = Math.min(ticker.bid, this.limit);
          else
            top = Math.max(ticker.ask, this.limit);

          // note: might be string VS float
          if(top != this.price)
            return this.move(top);

          this.timeout = setTimeout(this.checkOrder, this.checkInterval);
          this.sticking = false;
        });

        return;
      }

      if(!result.executed) {
        // not open and not executed means it never hit the book
        this.sticking = false;
        this.status = states.REJECTED;
        this.emitStatus();
        this.finish();
        return;
      }

      // order got filled!
      this.sticking = false;
      this.filled(this.price);

    });
  }

  move(price) {
    this.status = states.MOVING;
    this.emitStatus();

    this.api.cancelOrder(this.id, (err, filled) => {
      // it got filled before we could cancel
      if(filled)
        return this.filled(this.price);

      // update to new price
      this.price = this.api.roundPrice(price);

      this.submit();
    });
  }

  calculateFilled() {
    let totalFilled = 0;
    _.each(this.orders, (order, id) => totalFilled += order.filled);

    return totalFilled;
  }

  moveLimit(limit) {
    if(
      this.status === states.COMPLETED ||
      this.status === states.FILLED
    )
      return;

    if(!limit)
      limit = this.moveLimitTo;

    if(this.limit === this.api.roundPrice(limit))
      // effectively nothing changed
      return;

    if(
      this.status === states.SUBMITTED ||
      this.status === states.MOVING ||
      this.sticking
    ) {
      this.moveLimitTo = limit;
      this.movingLimit = true;
      return;
    }

    this.limit = this.api.roundPrice(limit);

    clearTimeout(this.timeout);

    this.movingLimit = false;

    if(this.side === 'buy' && this.limit > this.price) {
      this.sticking = true;
      this.move(this.limit);
    } else if(this.side === 'sell' && this.limit < this.price) {
      this.sticking = true;
      this.move(this.limit);
    } else {
      this.timeout = setTimeout(this.checkOrder, this.checkInterval);
    }
  }

  moveAmount(amount) {
    if(
      this.status === states.COMPLETED ||
      this.status === states.FILLED
    )
      return;

    if(!amount)
      amount = this.moveAmountTo;

    if(this.amount === this.api.roundAmount(amount))
      // effectively nothing changed
      return;

    if(
      this.status === states.SUBMITTED ||
      this.status === states.MOVING ||
      this.sticking
    ) {
      this.moveAmountTo = amount;
      this.movingAmount = true;
      return;
    }

    this.amount = this.api.roundAmount(amount - this.calculateFilled());

    if(this.amount < this.data.market.minimalOrder.amount) {
      if(this.calculateFilled()) {
        // we already filled enough of the order!
        return this.filled();
      } else {
        throw new Error("The amount " + this.amount + " is too small.");
      }
    }

    clearTimeout(this.timeout);

    this.movingAmount = false;

    if(this.side === 'buy' && this.limit > this.price) {
      this.sticking = true;
      this.move(this.limit);
    } else if(this.side === 'sell' && this.limit < this.price) {
      this.sticking = true;
      this.move(this.limit);
    } else {
      this.timeout = setTimeout(this.checkOrder, this.checkInterval);
    }
  }

  cancel() {
    if(
      this.status === states.INITIALIZING ||
      this.status === states.COMPLETED ||
      this.status === states.CANCELLED ||
      this.status === states.REJECTED
    )
      return;

    if(
      this.status === states.SUBMITTED ||
      this.status === states.MOVING
    ) {
      this.cancelling = true;
      return;
    }

    clearTimeout(this.timeout);

    this.api.cancelOrder(this.id, filled => {

      this.cancelling = false;

      if(filled)
        return this.filled(this.price);

      this.status = states.CANCELLED;
      this.emitStatus();

      this.finish(false);
    })
  }
 
}

module.exports = StickyOrder;