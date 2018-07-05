'use strict';
const { promisify } = require('util');
const http = require('http');
const Koa = require('koa');
const KoaRouter = require('koa-router');
const Vapr = require('vapr');

exports.koa = async () => {
	const app = new Koa;
	const router = new KoaRouter;
	const server = http.createServer(app.callback());
	server.keepAliveTimeout = 100;
	app.use(router.routes());
	app.use(router.allowedMethods());
	await promisify(server.listen.bind(server, 0))();
	return { app: router, server };
};

exports.vapr = async () => {
	const app = Vapr();
	const server = http.createServer(app);
	server.keepAliveTimeout = 100;
	await promisify(server.listen.bind(server, 0))();
	return { app, server };
};