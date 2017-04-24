const HydraHttpPlugin = require('./index').HydraHttpPlugin;

describe('Hydra HTTP plugin', () => {
    it('init', async() => {

        let hydra = require('hydra');
        hydra.use(new HydraHttpPlugin());

        await hydra.init({
            hydra: {
                'serviceName': 'express-service-test',
                'serviceDescription': 'Basic express service on top of Hydra',
                'serviceIP': '127.0.0.1',
                'servicePort': 3000,
                'serviceType': 'express',
                'serviceVersion': '1.0.0',
                'redis': {
                    'host': '127.0.0.1',
                    'port': 6379,
                    'db': 15
                }
            }
        });

        await hydra.registerService();
        console.log(await hydra.http.lb.translate('express-service-test'));


        return hydra.shutdown();
    });
});