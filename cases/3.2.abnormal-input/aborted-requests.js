'use strict';
const { River } = require('vapr');
const makeStream = require('../../util/make-stream');
const example = require('../../util/example');
const send = require('../../util/send');

async function koa(app, port) {
	let result = 'The response was considered valid (wrong)';
	let cleanupState = 'The stream resource was leaked';
	let client = send(port, `GET / HTTP/1.0\n\n`);
	app.get('/', (ctx) => {
		client.dropConnection();
		const stream = makeStream(100);
		stream.on('close', () => { cleanupState = 'The stream resource was cleaned up properly'; });
		ctx.body = stream;
	});
	try { await client; }
	catch (err) { result = err.message; }
	await new Promise(resolve => setTimeout(resolve, 10)); // Account for network lag
	return `${result}\n${cleanupState}`;
}

async function vapr(app, port) {
	let result = 'The response was considered valid (wrong)';
	let cleanupState = 'The stream resource was leaked';
	let client = send(port, `GET / HTTP/1.0\n\n`);
	app.get('/', (req) => {
		client.dropConnection();
		const stream = makeStream(100);
		stream.on('close', () => { cleanupState = 'The stream resource was cleaned up properly'; });
		return [[River.riverify(stream)]];
	});
	try { await client; }
	catch (err) { result = err.message; }
	await new Promise(resolve => setTimeout(resolve, 10)); // // Account for network lag
	return `${result}\n${cleanupState}`;
}

example.koa(koa).then(() => example.vapr(vapr));
