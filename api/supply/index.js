'use strict';

const {web3Factory} = require("../../utils/web3");
const JoeContactABI = require('../../abis/JoeContactABI.json');
const {AVAX_CHAIN_ID} = require("../../constants");
const joeTokenAddress = "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd"
const BN = require('bn.js');

const web3 = web3Factory(AVAX_CHAIN_ID);
const joeContract = new web3.eth.Contract(JoeContactABI, joeTokenAddress);

async function circulatingSupply(ctx) {
  ctx.body = new BN(await getCirculatingSupply()).div(new BN(2)).toString();
}

async function getCirculatingSupply() {
  return await joeContract.methods.totalSupply().call();
}

async function maxSupply(ctx) {
  ctx.body = await getMaxSupply();
}

async function getMaxSupply() {
  return await joeContract.methods.maxSupply().call();
}

async function totalSupply(ctx) {
  ctx.body = await getCirculatingSupply();
}

module.exports = {circulatingSupply, totalSupply, maxSupply};
