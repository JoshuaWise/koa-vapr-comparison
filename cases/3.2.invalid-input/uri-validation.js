'use strict';
const example = require('../../util/example');
const send = require('../../util/send');

const URI = 'http://evil-uri.com/\u2590\u2590\u2590';

async function koa(app, port) {
	let result;
	app.get('/:page', (ctx) => { ctx.body = 'the request was serviced (security vulnerability)'; });
	try {
		const response = await send(port, `GET ${URI} HTTP/1.1\n\n`);
		result = response.body;
	} catch (err) {
		result = err.message;
	}
	return `GET ${URI}\n${result}`;
}

async function vapr(app, port) {
	let result;
	app.get('/:page', () => [['the request was serviced (security vulnerability)']]);
	try {
		const response = await send(port, `GET ${URI} HTTP/1.1\n\n`);
		result = response.body;
	} catch (err) {
		result = err.message;
	}
	return `GET ${URI}\n${result}`;
}

example.koa(koa).then(() => example.vapr(vapr));
