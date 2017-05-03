# The HTTP Proxy/Router
The hydra-plugin-http also introduce awesome core proxy/routing features.  
The responsibilities of this component can be described as:
* Finding an online service who is serving a target HTTP endpoint.
* Translate a service-name to a base URL targeting the optimum computing node. To accomplish this function it uses the [Load Balancer](lb.md).
* By using the battle-tested node [http-proxy](https://github.com/nodejitsu/node-http-proxy) module, it is able to expose an HTTP proxy that route requests to internal micro-services. This process also does route's matching to select the appropriated node.

## Configuration
```js
hydra.use(new HydraHttpPlugin({
    proxy: {
        routesCache: true, // if true, the proxy only retrieve the full routes list one time, after that those are updated during each service routes registration.

        // other optional http-proxy module config params https://www.npmjs.com/package/http-proxy#options 
        // excluding built-in http server instantiation params, which will be excluded
    }
}));
```

## Usage
### Find an online service responsible for target HTTP endpoint (path/method)
```js
let servicename == hydra.http.proxy.findService('/v1/email/send', 'POST');
```

### Complete HTTP proxy server example
```js
const hydra = require('hydra');
const HydraHttpPlugin = require('hydra-plugin-http').HydraHttpPlugin;

hydra.use(new HydraHttpPlugin({}));

(async() => {
    await hydra.init({
        hydra: {
            'serviceName': 'hydra-router',
            'serviceDescription': 'Bullet-proof HTTP proxy server on top of Hydra',
            'serviceIP': '127.0.0.1',
            'servicePort': 8080,
            'serviceType': 'native',
            'serviceVersion': '1.0.0',
            'redis': {
                'host': '127.0.0.1',
                'port': 6379,
                'db': 15
            }
        }
    });
    await hydra.registerService();

    let server = require('http').createServer();

    // attaching the HTTP server instance to the hydra proxy
    let rawHttpProxy = hydra.http.proxy.attach(server);

    server.listen(hydra.config.servicePort, (err) => {
        console.log(err || 'Hydra proxy server running on port: ' + hydra.config.servicePort);
        if (!err) {
            console.log(' - routes cache enabled: ' + hydra.http.proxy.config.routesCache);

            console.log();
            console.log(' You can try any request with the schema: ');
            console.log(' > http://localhost:' + hydra.config.servicePort + '/:servicename/:route');
            console.log(' > http://localhost:' + hydra.config.servicePort + '/:route');
        }
    });
})();
```
### http-proxy module integration
For advanced users looking for the http-proxy module integration internals, is just that simple:
```js
proxy.web(req, res, {
    target: await hydra.http.proxy.translate(req, true)
});
```