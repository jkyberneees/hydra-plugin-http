const assert = require('assert');
const axios = require('axios');



module.exports = (hydra, config) => {
    const trigger = (name, level, data) => hydra.emit('http-plugin-lb', {
        name,
        level,
        data
    });

    config.lb = Object.assign({
        strategy: {
            name: 'race',
            timeout: 3000,
            nodes: 3,
            healthPath: '_health'
        }
    }, config.lb || {});

    assert(config.lb.strategy.handler || handlers[config.lb.strategy.name],
        `The load balancer '${config.lb.strategy.name}' strategy handler is required!`);

    return {
        translate: async service => {
            try {
                let now = new Date().getTime();
                let presences = await hydra.getServicePresence(service);
                assert(presences.length > 0, '503:Service Unavailable!');

                let handler = config.lb.strategy.handler || handlers[config.lb.strategy.name];
                let url = await handler(config.lb.strategy, presences, hydra, service);

                trigger('translate', 'info', {
                    service,
                    translation: url,
                    strategy: config.lb.strategy.name,
                    responseTime: new Date().getTime() - now
                });

                return url;
            } catch (err) {
                trigger('translate', 'error', err);

                throw err;
            }
        }
    }
}

const handlers = {
    race: async(config, presences, hydra, service) => {
        let calls = [];
        presences.slice(0, Math.min(config.nodes, presences.length)).forEach(presence => {
            let baseUrl = `http://${presence.ip}:${presence.port}`;

            calls.push(new Promise((resolve, reject) => {
                axios({
                        method: 'get',
                        url: baseUrl + '/' + config.healthPath,
                        timeout: config.timeout
                    })
                    .then((response) => {
                        resolve(baseUrl);
                    }).catch(() => {});

                setTimeout(() => reject(new Error('503:Service Unavailable!')), config.timeout);
            }));
        });

        return await Promise.race(calls);
    }
}