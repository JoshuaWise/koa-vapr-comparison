'use strict';
const { PathRouter, MethodRouter } = require('vapr');
const KoaRouter = require('koa-router');

exports.koa = (routes) => {
	const router = new KoaRouter;
	const controller = { onDone: undefined };
	const handler = () => (0, controller.onDone)();
	for (const route of routes) router.get(route, handler);
	return { router: router.routes(), controller };
};

exports.vapr = (routes) => {
	const router = new PathRouter;
	const controller = { onDone: undefined };
	const handler = () => (0, controller.onDone)();
	for (const route of routes) router.route(route, new MethodRouter().get(handler));
	return { router, controller };
};
