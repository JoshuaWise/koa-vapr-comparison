'use strict';
const clc = require('cli-color');
const nodemark = require('nodemark');

class Benchmark {
	constructor(name) {
		this._name = name;
		this._trials = [];
		this._original = this;
		this._next = undefined;
	}
	add(name, fn, setup) {
		this._trials.push({ name, fn, setup });
		return this;
	}
	next(name) {
		this._next = new Benchmark(name);
		this._next._original = this._original;
		return this._next;
	}
	exec() {
		return this._original._exec();
	}
	async _exec() {
		console.log(clc.green(`${this._name}:`));
		for (const { name, fn, setup } of this._trials) {
			const result = await nodemark(fn, setup);
			console.log(`${name} x ${result}`);
		}
		console.log('');
		if (this._next) return this._next._exec();
	}
}

module.exports = name => new Benchmark(name);
