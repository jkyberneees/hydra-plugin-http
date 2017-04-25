const Route = require('route-parser');
const url = require('url');
const assert = require('assert');

module.exports = (hydra, config) => {

    return {
        findService: async(path, method = 'GET') => {
            let routes = await hydra.getAllServiceRoutes();

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
            server.addListener("request", async(req, res) => {
                try {
                    proxy.web(req, res, {
                        target: await hydra.http.proxy.translate(req, true)
                    });
                } catch (err) {
                    console.log(err);
                }
            });
        }
    }
}