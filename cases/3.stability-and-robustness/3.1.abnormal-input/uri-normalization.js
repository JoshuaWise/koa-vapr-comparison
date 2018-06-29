'use strict';
const example = require('../../../util/example');

async function koa(app, port) {

}

async function vapr(app, port) {

}

example.koa(koa).then(() => example.vapr(vapr));
