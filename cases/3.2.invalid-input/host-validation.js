'use strict';
const example = require('../../util/example');
const send = require('../../util/send');

const header = 'Host: evil-host.com:65556';

async function koa(app, port) {
	let result;
	app.get('/', (ctx) => { ctx.body = 'the request was serviced (security vulnerability)'; });
	try {
		const response = await send(port, `GET / HTTP/1.1\n${header}\n\n`);
		result = response.body;
	} catch (err) {
		result = err.message;
	}
	return `${header}\n${result}`;
}

async function vapr(app, port) {
	let result;
	app.get('/', () => [['the request was serviced (security vulnerability)']]);
	try {
		const response = await send(port, `GET / HTTP/1.1\n${header}\n\n`);
		result = response.body;
	} catch (err) {
		result = err.message;
	}
	return `${header}\n${result}`;
}

example.koa(koa).then(() => example.vapr(vapr));
