'use strict';
const clc = require('cli-color');
const makeServer = require('./make-server');

const example = async (name, fn) => {
	const { app, server } = await makeServer[name.toLowerCase()]();
	try {
		const value = await fn(app, server.address().port);
		console.log(clc.green(`${name}:`));
		console.log(value);
	} catch (err) {
		console.log(clc.red(`${name} (ERROR):`));
		console.log(err);
	}
	console.log('');
	server.close();
};

exports.koa = fn => example('Koa', fn);
exports.vapr = fn => example('Vapr', fn);
