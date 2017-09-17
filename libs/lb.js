/* eslint no-param-reassign:0 */

const assert = require('assert');
const axios = require('axios');

const handlers = {
  race: async (config, presences) => {
    const calls = [];
    presences.slice(0, Math.min(config.nodes, presences.length)).forEach((presence) => {
      const baseUrl = `http://${presence.ip}:${presence.port}`;

      calls.push(
        new Promise((resolve, reject) => {
          axios({
            method: 'get',
            url: `${baseUrl}/${config.healthPath}`,
            timeout: config.timeout,
          })
            .then(() => {
              resolve(baseUrl);
            })
            .catch(() => {});

          setTimeout(() => reject(new Error('503:Service Unavailable!')), config.timeout);
        }),
      );
    });

    return Promise.race(calls);
  },

  'last-presence': (config, presences) => {
    const srv = presences[0];

    return `http://${srv.ip}:${srv.port}`;
  },
};

module.exports = (hydra, config) => {
  const trigger = (name, level, data) =>
    hydra.emit('http-plugin-lb', {
      name,
      level,
      data,
    });

  config.lb = Object.assign(
    {
      strategy: {
        name: 'race',
        timeout: 3000,
        nodes: 3,
        healthPath: '_health',
      },
    },
    config.lb || {},
  );

  assert(
    config.lb.strategy.handler || handlers[config.lb.strategy.name],
    `The load balancer '${config.lb.strategy.name}' strategy handler is required!`,
  );

  return {
    config: config.lb,
    translate: async (service) => {
      try {
        const now = new Date().getTime();
        const presences = await hydra.getServicePresence(service);
        assert(presences.length > 0, '503:Service Unavailable!');

        const handler = config.lb.strategy.handler || handlers[config.lb.strategy.name];
        const url = await handler(config.lb.strategy, presences, hydra, service);

        trigger('translate', 'info', {
          service,
          translation: url,
          strategy: config.lb.strategy.name,
          responseTime: new Date().getTime() - now,
        });

        return url;
      } catch (err) {
        trigger('translate', 'error', err);

        throw err;
      }
    },
  };
};
