'use strict';
const benchmark = require('../../util/benchmark');
const makeRoutes = require('../../util/make-routes');
const makeRouter = require('../../util/make-router');
const mock = require('../../util/mock');

const segments = ['loremipsum', 'dolorsit', 'ametconsectetur', 'adipiscingelit', 'maurismalesuada', 'aliquettempor'];
const firstUrl = '/' + segments[0];
const lastUrl = '/' + segments.slice(0, -1).concat('aliquet').join('/');
const fewRoutes = makeRoutes(segments.slice(0, 1), 1);
const mediumRoutes = makeRoutes(segments, 1);
const manyRoutes = makeRoutes(segments, 11);
const extremeRoutes = makeRoutes(segments, 112);

const benchmarkRouter = (name, routes, url) => {
	const { router, controller } = makeRouter[name](routes);
	const mockArg = name === 'koa' ? mock.context : mock.request;
	let arg;
	const subject = (done) => {
		controller.onDone = done;
		router(arg);
	};
	const setup = () => {
		arg = mockArg(url);
	};
	return [name, subject, setup];
};

benchmark('1 route (best case)')
	.add(...benchmarkRouter('koa', fewRoutes, firstUrl))
	.add( ...benchmarkRouter('vapr', fewRoutes, firstUrl))
	.next(`${mediumRoutes.length} routes (worst case)`)
	.add(...benchmarkRouter('koa', mediumRoutes, lastUrl))
	.add( ...benchmarkRouter('vapr', mediumRoutes, lastUrl))
	.next(`${manyRoutes.length} routes (worst case)`)
	.add(...benchmarkRouter('koa', manyRoutes, lastUrl))
	.add( ...benchmarkRouter('vapr', manyRoutes, lastUrl))
	.next(`${extremeRoutes.length} routes (worst case)`)
	.add(...benchmarkRouter('koa', extremeRoutes, lastUrl))
	.add( ...benchmarkRouter('vapr', extremeRoutes, lastUrl))
	.exec();
