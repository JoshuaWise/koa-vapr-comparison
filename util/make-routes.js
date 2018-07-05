'use strict';

module.exports = (segments, polymorphism = 1) => {
	if (!(+polymorphism <= 9999)) throw new TypeError('Invalid polymorphism value');
	const routes = makeRoutes(segments);
	if (--polymorphism >= 1) {
		const prefixes = new Array(polymorphism >>> 0).fill().map((_, i) => nonce(i));
		const length = routes.length;
		for (let i = 0; i < length; ++i) {
			const route = routes[i];
			for (let j = 0; j < polymorphism; ++j) similarRoute(routes, route, prefixes[j]);
		}
	}
	return routes.map(route => '/' + route.join('/'));
};

const makeRoutes = (segments, pathological = true) => {
	const params = new Array(segments.length).fill().map((_, i) => ':param' + i);
	const routes = [];
	(function branch(prev) {
		if (prev.length === segments.length) return;
		const newRoutes = [prev.concat(segments[prev.length])];
		if (!pathological || prev.length !== segments.length - 1) newRoutes.push(prev.concat(params[prev.length]));
		routes.push(...newRoutes);
		for (const newRoute of newRoutes) branch(newRoute);
	})([]);
	if (pathological) routes.push(params);
	return routes;
};

const similarRoute = (routes, oldRoute, prefix) => {
	let newRoute;
	for (let i = 0; i < oldRoute.length; ++i) {
		if (newRoute) {
			newRoute.push(oldRoute[i]);
		} else if (oldRoute[i].charCodeAt(0) !== 58) {
			newRoute = oldRoute.slice(0, i);
			newRoute.push(prefix + oldRoute[i]);
		}
	}
	if (newRoute) routes.push(newRoute);
};

const nonce = (num) => {
	let str = '';
	do { str += String.fromCharCode(97 + num % 26); }
	while ((num -= 26) >= 0);
	return str + '~';
};
