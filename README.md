# hydra-plugin-http
Hydra plugin that enables traditional HTTP requests, routing and proxy capabilities to your micro-service infrastructure based on [hydra](https://www.hydramicroservice.com/).

# Usage
## Install Dependencies
```bash
npm i hydra-plugin-http --save
```
## Register the plugin
```js
const hydra = require('hydra');
const HydraHttpPlugin = require('hydra-plugin-http').HydraHttpPlugin;
hydra.use(new HydraHttpPlugin());

// ...
await hydra.init({
    hydra: {
        'serviceName': 'hydra-router',
        'serviceDescription': 'Bullet-proof HTTP proxy server on top of Hydra',
        'serviceIP': '127.0.0.1',
        'servicePort': 5000,
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
```
## Use it ;)

Making HTTP requests to internal/external micro-services using [axios](https://www.npmjs.com/package/axios):
```js
// GET request targeting an internal endpoint in the cluster
let res = await hydra.http.request('/v1/email/config');

// POST request targeting an internal endpoint in the cluster
res = await hydra.http.request.post('/v1/email/send', {
    to: 'account@email.com'
    // ...
});

// GET request targeting an external endpoint
res = await hydra.http.request('https://www.google.de/?q=hydra+microservices');
```
> The **request** object is literally an instance of *axios*, with automatic URL resolving for internal micro-services. As simple as it can be ;)  
> Any URL with the schema */:servicename/:route* or */:route*, will be automatically translated into a valid micro-service cluster URL. 

## Demos
Demos available into [demos folder](demos) on the git repository: https://github.com/jkyberneees/hydra-plugin-http

# Next topics
- [Service Load Balancer](docs/lb.md)
- [The HTTP proxy/router server](docs/proxy.md)
