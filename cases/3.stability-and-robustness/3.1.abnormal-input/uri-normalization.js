'use strict';
const example = require('../../../util/example');
const send = require('../../../util/send');

const URI = `/${encodeURIComponent('terms&privacy')}`;

async function koa(app, port) {
	app.get('/terms&privacy', (ctx) => { ctx.body = 'this is the correct page'; });
	app.get('/:page', (ctx) => { ctx.body = 'this is the WRONG page'; });
	const response = await send(port, `GET ${URI} HTTP/1.1\n\n`);
	return response.body;
}

async function vapr(app, port) {
	app.get('/terms&privacy', () => [['this is the correct page']]);
	app.get('/:page', () => [['this is the WRONG page']]);
	const response = await send(port, `GET ${URI} HTTP/1.1\n\n`);
	return response.body;
}

example.koa(koa).then(() => example.vapr(vapr));
