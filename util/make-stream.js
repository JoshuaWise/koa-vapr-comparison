'use strict';
const { Readable } = require('stream');
const items = Symbol();
const delay = Symbol();
const dead = Symbol();

class Stream extends Readable {
	constructor(duration, iterable = ['a', 'b', 'c']) {
		super({ objectMode: true, highWaterMark: 2 });
		this[items] = Array.from(iterable);
		this[delay] = ~~(duration / this[items].length);
		this[dead] = false;
	}
	_read() {
		setTimeout(function flow() {
			if (this[dead]) return;
			if (this[items].length === 0) {
				this.push(null);
				finish(this);
				return;
			}
			let item = this[items].shift();
			if (item instanceof Error) return void this.destroy(item);
			if (item === null) item = {};
			if (this.push(item)) setTimeout(flow.bind(this), this[delay]);
		}.bind(this), this[delay]);
	}
	_destroy(err, cb) {
		if (this[dead]) return void cb();
		finish(this);
		cb(err);
	}
}

const finish = (self) => {
	self[items] = [];
	self[dead] = true;
	setImmediate(() => { self.emit('close'); });
};

module.exports = (...args) => new Stream(...args);
