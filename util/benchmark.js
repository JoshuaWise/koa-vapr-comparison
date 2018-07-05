'use strict';
const nodemark = require('nodemark');

module.exports = (name, fn, setup) => Promise.resolve(nodemark(fn, setup))
	.then(result => `${name} x ${result}`);
