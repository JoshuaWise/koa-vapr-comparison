'use strict';
const makeServer = require('../../util/make-server');
const makeRoutes = require('../../util/make-routes');

Promise.all([makeServer.koa(), makeServer.vapr()]).then(([koa, vapr]) => {
	// TODO
});
