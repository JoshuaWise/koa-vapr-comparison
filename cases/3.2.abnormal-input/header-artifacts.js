'use strict';
const example = require('../../util/example');
const send = require('../../util/send');

function unusualHttpClient(username) {
	return `GET / HTTP/1.1\nX-Username:${username} \n\n`;
}

function isLoggedIn(username) {
	return username === 'John Smith';
}

async function koa(app, port) {
	app.get('/', (ctx) => {
		if (isLoggedIn(ctx.get('X-Username'))) ctx.body = 'User is logged in! (correct)';
		else ctx.body = 'User cannot log in. (wrong)';
	});
	const response = await send(port, unusualHttpClient('John Smith'));
	return response.body;
}

async function vapr(app, port) {
	app.get('/', (req) => {
		if (isLoggedIn(req.headers.get('X-Username'))) return [['User is logged in! (correct)']];
		return [['User cannot log in. (wrong)']];
	});
	const response = await send(port, unusualHttpClient('John Smith'));
	return response.body;
}

example.koa(koa).then(() => example.vapr(vapr));
