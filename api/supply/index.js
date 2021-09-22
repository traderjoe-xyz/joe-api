'use strict';

const {web3Factory} = require("../../utils/web3");
const ERC20ContractABI = require('../../abis/ERC20ContractABI.json');
const {AVAX_CHAIN_ID} = require("../../constants");
const joeTokenAddress = "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd"
const BN = require('bn.js');

const web3 = web3Factory(AVAX_CHAIN_ID);
const joeContract = new web3.eth.Contract(ERC20ContractABI, joeTokenAddress);


async function getTotalSupply() {
  return await joeContract.methods.totalSupply().call();
}

async function getMaxSupply() {
  return await joeContract.methods.maxSupply().call();
}

async function getBalanceOf(address) {
  return await joeContract.methods.balanceOf(address).call();
}

async function circulatingSupply(ctx) {
  var develeopmentFunds = new BN(await getBalanceOf("0xaFF90532E2937fF290009521e7e120ed062d4F34"));
  var foundationFunds = new BN(await getBalanceOf("0x66Fb02746d72bC640643FdBa3aEFE9C126f0AA4f"));
  var strategicInvestorFunds = new BN(await getBalanceOf("0xc13B1C927565C5AF8fcaF9eF7387172c447f6796"));
  ctx.body = new BN(await getTotalSupply()).sub(develeopmentFunds).sub(foundationFunds).sub(strategicInvestorFunds).toString();
}

async function maxSupply(ctx) {
  ctx.body = await getMaxSupply();
}


async function totalSupply(ctx) {
  ctx.body = await getTotalSupply();
}

module.exports = {circulatingSupply, totalSupply, maxSupply};
