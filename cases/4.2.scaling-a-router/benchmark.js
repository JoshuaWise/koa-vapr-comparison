'use strict';
const example = require('../../util/example');
const benchmark = require('../../util/benchmark');
const makeRoutes = require('../../util/make-routes');
const segments = ['elit', 'ipsum', 'occaecat', 'consectetur', 'reprehenderit', 'ex'];

async function koa(app) {
	
}

async function vapr(app) {
	
}

example.koa(koa).then(() => example.vapr(vapr));
