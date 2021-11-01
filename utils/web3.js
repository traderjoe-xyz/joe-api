const Web3 = require("web3");
const { AVAX_RPC } = require("../constants");

const { AVAX_CHAIN_ID } = require("../constants");

const clients = { avax: [] };

clients.avax.push(new Web3(AVAX_RPC));

const avaxRandomClient = () =>
  clients.avax[~~(clients.avax.length * Math.random())];

module.exports = {
  get avaxWeb3() {
    return avaxRandomClient();
  },

  web3Factory: (chainId) => {
    switch (chainId) {
      case AVAX_CHAIN_ID:
        return avaxRandomClient();
    }
  },
};
