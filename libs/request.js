/* eslint no-param-reassign:0 */

const axios = require('axios');
const uuid = require('uuid');

module.exports = (hydra) => {
  const trigger = (name, level, data) =>
    hydra.emit('http-plugin-request', {
      name,
      level,
      data,
    });

  axios.interceptors.request.use(
    async (config) => {
      config.headers['X-Request-ID'] = config.headers['X-Request-ID'] || uuid.v4();
      if (config.url.startsWith('/')) {
        config.url = await hydra.http.proxy.translate(config);
        config.targetHydraCluster = true;
      }

      trigger('request', 'info', config);

      return config;
    },
    (err) => {
      trigger('request', 'error', err);

      return Promise.reject(err);
    },
  );

  axios.interceptors.response.use(
    (response) => {
      trigger('response', 'info', response);

      return response;
    },
    (err) => {
      trigger('response', 'error', err);

      return Promise.reject(err);
    },
  );

  return axios;
};
