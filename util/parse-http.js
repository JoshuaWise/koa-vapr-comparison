'use strict';
const statusLineRegexp = /^HTTP\/(1\.[01]) ([2-5]\d\d) ([^\r\n]*)\r\n/;
const headerRegexp = /^([^:]+):[ \t]*([^\r\n]*)[ \t]*\r\n/;
const emptyLine = /^\r\n/;

module.exports = (str) => {
	if (!str) throw new Error('The request was rejected');
	const response = {};
	const statusLine = str.match(statusLineRegexp);
	if (!statusLine) throw new Error('Invalid HTTP status line');
	response.version = statusLine[1];
	response.code = +statusLine[2];
	response.message = statusLine[3];
	if (response.code > 400) throw new Errro(`${response.code} response: ${response.message}`);
	str = str.slice(statusLine[0].length);
	response.headers = {};
	while (!emptyLine.test(str)) {
		const header = str.match(headerRegexp);
		if (!header) throw new Error('Invalid HTTP header');
		response.headers[header[1].toLowerCase()] = header[2];
		str = str.slice(header[0].length);
	}
	response.body = str.slice(2);
	return response;
};
