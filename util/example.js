'use strict';
const { promisify } = require('util');
const http = require('http');
const clc = require('cli-color');
const Koa = require('koa');
const KoaRouter = require('koa-router');
const Vapr = require('vapr');

exports.koa = async (fn) => {
  const app = new Koa;
  const router = new KoaRouter;
  const server = http.createServer(app.callback());
  server.keepAliveTimeout = 100;
  app.use(router.routes());
  app.use(router.allowedMethods());
  return promisify(server.listen.bind(server, 0))()
    .then(() => fn(router, server.address().port))
    .then(success('Koa'), failure('Koa'))
    .then(() => server.close());
};

exports.vapr = async (fn) => {
  const app = Vapr();
  const server = http.createServer(app);
  server.keepAliveTimeout = 100;
  return promisify(server.listen.bind(server, 0))()
    .then(() => fn(app, server.address().port))
    .then(success('Vapr'), failure('Vapr'))
    .then(() => server.close());
};

const success = (name) => (value) => {
  console.log(clc.green(`${name}:`));
  console.log(value);
  console.log('');
};

const failure = (name) => (reason) => {
  console.log(clc.red(`${name} (ERROR):`));
  console.log(reason);
  console.log('');
};
