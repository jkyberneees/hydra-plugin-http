const assert = require('assert');
const axios = require('axios');

module.exports = (hydra, config) => {
    config.lb = Object.assign({
        strategy: 'race'
    }, config.lb || {});

    return {
        translate: async serviceName => {
            let presences = await hydra.getServicePresence(serviceName);
            assert(presences.length > 0, `The target '${serviceName}' service is not available!`);

            return await handlers[config.lb.strategy](serviceName, presences, hydra);
        }
    }
}

const handlers = {
    race: async(serviceName, presences, hydra) => {
        let calls = [];
        presences.slice(0, Math.min(3, presences.length)).forEach(presence => {
            let prefix = base(presence);

            calls.push(new Promise((resolve, reject) => {
                axios({
                        method: 'get',
                        url: prefix + '/_health',
                        timeout: 3000
                    })
                    .then((response) => {
                        resolve(prefix);
                    }).catch(() => {});
            }));
        });

        return await Promise.race(calls);
    }
}

const base = (presence) => `http://${presence.ip}:${presence.port}`;