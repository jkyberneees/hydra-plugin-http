# The Service Load Balancer
The hydra-http-plugin uses an internal load balancer that is responsible for the selection of the "optimum" computing node for a target service in the micro-service cluster. It is used for internal HTTP calls and requests proxy.

The Load Balancer(lb) selection strategy can be extended for custom requirements. Built-in supported strategies are:
* **race**: The load balancer select N number of available nodes(ordered by their presence report) and perform a health check, the faster node on respond is selected. While this is the default strategy, the configuration options are described below:
```js
hydra.use(new HydraHttpPlugin({
    lb: {
        strategy: {
            name: 'race',           // strategy name
            timeout: 3000,          // call timeout
            nodes: 3,               // number of nodes to call
            healthPath: '_health'   // health check endpoint, for example: http://127.0.0.1:3000/_health
        }
    }
}));
```
* **last-presence**: The load balancer select the node who last reported presence status. This method is intended to be used when the service is already balanced or clustered, `Nginx Load Balancer` for example.  
Usage and configuration:
```js
hydra.use(new HydraHttpPlugin({
    lb: {
        strategy: {
            name: 'last-presence'  // strategy name
        }
    }
}));
```
### Implementing custom strategies
More strategies to be implemented in coming versions. However, passing a custom strategy is also pretty simple:
```js
hydra.use(new HydraHttpPlugin({
    lb: {
        strategy: {
            name: 'last-presence',          
            handler: async(config, presences, hydra, service) => {
                let service = presences[0]; // presences[0] contains the presence details of the last node who reported available

                return `http://${service.ip || service.hostName}:${service.port}`;
            }
        }
    }
}));
```
## Usage
```js
// getting the lb config
let lbConfig = hydra.http.lb.config;

// get the URL base for a custom service name
let urlBase = await hydra.http.lb.translate('service-name');
```
### Capturing lb events for post processing and monitoring
```js
hydra.on('http-plugin-lb', e => {
    
});
```