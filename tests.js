const HydraHttpPlugin = require('./index').HydraHttpPlugin;
const expect = require('chai').expect;
const hydra = require('hydra');

describe('Hydra HTTP plugin', () => {
    it('init hydra', async() => {
        hydra.use(new HydraHttpPlugin());

        await hydra.init({
            hydra: {
                'serviceName': 'hydra-router',
                'serviceDescription': 'Native service on top of Hydra',
                'serviceIP': '127.0.0.1',
                'servicePort': 3000,
                'serviceType': 'native',
                'serviceVersion': '1.0.0',
                'redis': {
                    'host': '127.0.0.1',
                    'port': 6379,
                    'db': 15
                },
                "plugins": {
                    "hydra-plugin-http": {
                        lb: {
                            strategy: {
                                name: 'race', // strategy name
                                timeout: 3000, // call timeout
                                nodes: 3, // number of nodes to call
                                healthPath: '_health' // health check endpoint, for example: http://127.0.0.1:3000/_health
                            }
                        }
                    }
                }
            }
        });

        await hydra.registerService();
    });

    it('lb.translate should succeed', async() => {
        let baseUrl = await hydra.http.lb.translate('express-service-test');
        expect(baseUrl).to.equal('http://127.0.0.1:3000');
    });

    it('lb.translate should fail', async() => {
        try {
            let baseUrl = await hydra.http.lb.translate('unavailable-service');
        } catch (err) {
            expect(err instanceof Error).to.equal(true);
        }
    });

    it('request should succeed - http://127.0.0.1:3000/v1/welcome', async() => {
        let res = await hydra.http.request('http://127.0.0.1:3000/v1/welcome');
        expect(res.status).to.equal(200);
    });

    it('request should succeed - /express-service-test/v1/welcome', async() => {
        let res = await hydra.http.request('/express-service-test/v1/welcome');
        expect(res.status).to.equal(200);
    });

    it('request should succeed - /v1/welcome', async() => {
        let res = await hydra.http.request('/v1/welcome');
        expect(res.status).to.equal(200);
    });

    it('request should fail - /v1/welcome222', async() => {
        try {
            let res = await hydra.http.request('/v1/welcome222');
        } catch (err) {
            expect(err instanceof Error).to.equal(true);
        }
    });

    it('proxy.findService should succeed - /v1/welcome?age=31', async() => {
        let res = await hydra.http.proxy.findService('/v1/welcome?age=31', 'get');
        expect(res.name).to.equal('express-service-test');
        expect(res.path).to.equal('/v1/welcome?age=31');
    });

    it('proxy.findService should succeed - /express-service-test/v1/welcome', async() => {
        let res = await hydra.http.proxy.findService('/express-service-test/v1/welcome', 'get');
        expect(res.name).to.equal('express-service-test');
    });

    it('proxy.findService should fail - /express-service-test/v1/welcome222', async() => {
        let res = await hydra.http.proxy.findService('/express-service-test/v1/welcome222', 'get');
        expect(res).to.equal(null);
    });

    it('proxy.findService should fail - /unexisting-service/v1/welcome', async() => {
        let res = await hydra.http.proxy.findService('/unexisting-service/v1/welcome', 'get');
        expect(res).to.equal(null);
    });

    it('proxy.findService should fail - /v1/welcome222', async() => {
        let res = await hydra.http.proxy.findService('/v1/welcome222', 'get');
        expect(res).to.equal(null);
    });

    it('proxy.attach', async() => {
        let http = require('http');
        let server = http.createServer();

        hydra.http.proxy.attach(server);
        server.listen(5050);

        let res = await hydra.http.request('http://localhost:5050/v1/welcome');
        expect(res.status).to.equal(200);
        expect(res.data).to.equal('Hello World!');

        try {
            res = await hydra.http.request('http://localhost:5050/v1/welcome222');
        } catch (err) {
            expect(err.response.status).to.equal(503);
        }
        server.close();
    });

    it('shutdown hydra', async() => {
        hydra.shutdown();
    });
});