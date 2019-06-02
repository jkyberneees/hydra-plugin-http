/* eslint import/no-extraneous-dependencies:0, no-unused-vars:0,
import/no-unresolved:0, no-console:0 */

const hydra = require('hydra')
const HydraHttpPlugin = require('./../index').HydraHttpPlugin
const http = require('http')

hydra.use(
  new HydraHttpPlugin({
    proxy: {
      routesCache: true
    }
  })
);

(async () => {
  await hydra.init({
    hydra: {
      serviceName: 'hydra-router',
      serviceDescription: 'Bullet-proof HTTP proxy server on top of Hydra',
      serviceIP: '127.0.0.1',
      servicePort: 5000,
      serviceType: 'native',
      serviceVersion: '1.0.0',
      redis: {
        host: '127.0.0.1',
        port: 6379,
        db: 15
      }
    }
  })
  await hydra.registerService()

  const server = http.createServer()
  server.listen(hydra.config.servicePort, (err) => {
    console.log(err || `Hydra proxy server running on port: ${hydra.config.servicePort}`)
    if (!err) {
      const rawHttpProxy = hydra.http.proxy.attach(server)
      console.log(` - routes cache enabled: ${hydra.http.proxy.config.routesCache}`)

      console.log()
      console.log(' You can try any request with the schema: ')
      console.log(` > http://localhost:${hydra.config.servicePort}/:servicename/:route`)
      console.log(` > http://localhost:${hydra.config.servicePort}/:route`)
    }
  })
})()
