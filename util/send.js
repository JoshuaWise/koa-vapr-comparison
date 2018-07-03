'use strict';
const net = require('net');
const parseHttp = require('./parse-http');

module.exports = (port, data) => new Promise((resolve, reject) => {
	const chunks = [];
	const socket = net.connect(port);
	socket.setTimeout(2000);
	socket.on('error', reject);
	socket.on('close', () => reject(new Error('The connection was closed prematurely')));
	socket.on('timeout', () => { reject(new Error('The connection timed out')); socket.destroy(); });
	socket.on('connect', () => void socket.end(data));
	socket.on('data', chunk => void chunks.push(chunk));
	socket.on('end', () => {
		try {
			resolve(parseHttp(Buffer.concat(chunks).toString()));
		} catch (err) {
			reject(err);
		}
	});
});
