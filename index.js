const HydraPlugin = require('hydra/plugin');

class HydraHttpPlugin extends HydraPlugin {
    constructor(config = {}) {
        super('hydra-plugin-http');
        this.config = config;
    }

    setHydra(hydra) {
        super.setHydra(hydra);
    }

    setConfig(hConfig) {
        super.setConfig(hConfig);

        this.config.hydra = hConfig;
        this.configChanged(this.opts);
    }

    configChanged(opts = {}) {
        this.config = Object.assign(this.config, opts);
    }

    onServiceReady() {
        this.hydra.http = {
            request: require('./libs/request')(this.hydra, this.config),
            proxy: require('./libs/proxy')(this.hydra, this.config),
            lb: require('./libs/lb')(this.hydra, this.config)
        }
    }
}

module.exports = {
    HydraHttpPlugin
};