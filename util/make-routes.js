'use strict';

module.exports = (segments, polymorphism = 1) => {
	if (!(+polymorphism <= 26)) throw new TypeError('Invalid polymorphism value');
	const routes = makeRoutes(segments);
	if (--polymorphism >= 1) {
		const prefixes = new Array(polymorphism >>> 0).fill().map((_, i) => String.fromCharCode(97 + i) + '~');
		const length = routes.length;
		for (let i = 0; i < length; ++i) {
			const route = routes[i];
			for (let j = 0; j < polymorphism; ++j) similarRoute(routes, route, prefixes[j]);
		}
	}
	return routes.map(route => '/' + route.join('/'));
};

const makeRoutes = (segments) => {
	const params = new Array(segments.length).fill().map((_, i) => ':param' + i);
	const routes = [];
	(function branch(prev) {
		if (prev.length === segments.length) return;
		const a = prev.concat(segments[prev.length]);
		const b = prev.concat(params[prev.length]);
		routes.push(a, b);
		branch(a);
		branch(b);
	})([]);
	return routes;
};

const similarRoute = (routes, oldRoute, prefix) => {
	let newRoute;
	for (let i = 0; i < oldRoute.length; ++i) {
		const segment = oldRoute[i];
		if (segment.charCodeAt(0) === 58) {
			if (newRoute) newRoute.push(segment);
		} else {
			if (!newRoute) newRoute = oldRoute.slice(0, i);
			newRoute.push(prefix + segment);
		}
	}
	if (newRoute) routes.push(newRoute);
};
