'use strict';

const {web3Factory} = require("../../utils/web3");
const JoeContactABI = require('../../abis/JoeContactABI.json');
const {AVAX_CHAIN_ID} = require("../../constants");
const joeTokenAddress = "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd"

const web3 = web3Factory(AVAX_CHAIN_ID);
const joeContract = new web3.eth.Contract(JoeContactABI, joeTokenAddress);

async function circulatingSupply(ctx) {
  ctx.body = await getCirculatingSupply();
}

async function getCirculatingSupply() {
  return await joeContract.methods.totalSupply().call();
}

async function totalSupply(ctx) {
  ctx.body = await getTotalSupply();
}

async function getTotalSupply() {
  return await joeContract.methods.maxSupply().call();
}

module.exports = {circulatingSupply, totalSupply};
