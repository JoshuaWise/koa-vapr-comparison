'use strict';
const parseurl = require('parseurl');

exports.request = (url) => ({
	method: 'GET',
	url: Buffer.from(url).toString(), // Serialize string in v8
	headers: {},
	socket: {},
});

exports.context = (url) => ({
	req: exports.request(url),
	get method() { return this.req.method; },
	get path() { return parseurl(this.req).pathname; },
});
