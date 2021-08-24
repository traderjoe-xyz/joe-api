'use strict';

const {web3Factory} = require("../../utils/web3");
const JoeContactABI = require('../../abis/JoeContactABI.json');
const {AVAX_CHAIN_ID} = require("../../constants");
const joeTokenAddress = "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd"

const web3 = web3Factory(AVAX_CHAIN_ID);
const joeContract = new web3.eth.Contract(JoeContactABI, joeTokenAddress);

function convert(n){
  var sign = +n < 0 ? "-" : "",
      toStr = n.toString();
  if (!/e/i.test(toStr)) {
    return n;
  }
  var [lead,decimal,pow] = n.toString()
      .replace(/^-/,"")
      .replace(/^([0-9]+)(e.*)/,"$1.$2")
      .split(/e|\./);
  return +pow < 0
      ? sign + "0." + "0".repeat(Math.max(Math.abs(pow)-1 || 0, 0)) + lead + decimal
      : sign + lead + (+pow >= decimal.length ? (decimal + "0".repeat(Math.max(+pow-decimal.length || 0, 0))) : (decimal.slice(0,+pow)+"."+decimal.slice(+pow)))
}

async function circulatingSupply(ctx) {
  ctx.body = convert(await getCirculatingSupply() / 2);
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
