const Route = require('route-parser');
const url = require('url');
const assert = require('assert');
const uuid = require('uuid');

module.exports = (hydra, config) => {
    config.proxy = Object.assign({
        routesCache: true
    }, config.proxy || {});

    let routesCache = null;
    if (config.proxy.routesCache) {
        hydra.getAllServiceRoutes().then(routes => {
            routesCache = routes;

            hydra.on('message', async(msg) => {
                if (msg.bdy.action === 'refresh') {
                    routesCache[msg.bdy.serviceName] = await hydra._getRoutes(msg.bdy.serviceName);
                }
            });
        });
    }

    return {
        config: config.proxy,
        findService: async(path, method = 'GET') => {
            let routes = routesCache || await hydra.getAllServiceRoutes();

            for (let service in routes) {
                let index = path.indexOf('/' + service);
                if (index === 0) {
                    let subpath = path.substring(service.length + 1);
                    for (let route of routes[service]) {
                        if (new Route(route).match(`[${method.toUpperCase()}]${subpath}`)) {
                            if (await hydra.hasServicePresence(service)) return {
                                name: service,
                                path: subpath
                            };
                        }
                    }
                    break;
                }
            }

            for (let service in routes) {
                for (let route of routes[service]) {
                    if (new Route(route).match(`[${method.toUpperCase()}]${path}`)) {
                        if (await hydra.hasServicePresence(service)) return {
                            name: service,
                            path: path
                        };
                    }
                }
            }

            return null;
        },

        translate: async(req, prefixOnly = false) => {
            let path = url.parse(req.url).path;
            let service = await hydra.http.proxy.findService(path, config.method);
            assert(service, '503:Service Unavailable!');

            return (await hydra.http.lb.translate(service.name)) + ((prefixOnly) ? '' : req.url.replace(path, service.path));
        },

        attach: (httpServer) => {
            const proxy = require('http-proxy').createProxyServer(config.proxy || {});
            proxy.on('proxyReq', function (proxyReq, req, res, options) {
                if (!proxyReq.headers['x-request-id'])
                    proxyReq.setHeader('X-Request-ID', uuid.v4());
            });

            httpServer.addListener("request", async(req, res) => {
                try {
                    proxy.web(req, res, {
                        target: await hydra.http.proxy.translate(req, true)
                    });
                } catch (err) {
                    let msgparts = (err.message || '500:Internal Server Error').split(':', 2);
                    if (msgparts.length > 1) {
                        res.statusCode = parseInt(msgparts[0]);
                        res.statusMessage = msgparts[1];
                    } else {
                        res.statusCode = 500;
                        res.statusMessage = msgparts[0];
                    }

                    res.end();
                }
            });

            return proxy;
        }
    }
}