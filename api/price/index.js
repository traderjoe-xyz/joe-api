'use strict';

const {web3Factory} = require("../../utils/web3");
const JoeContactABI = require('../../abis/JoeContactABI.json');
const UsdceContractABI = require('../../abis/UsdceContractABI.json');
const UsdteContractABI = require('../../abis/UsdteContractABI.json');
const WavaxContractABI = require('../../abis/WavaxContractABI.json');
const {AVAX_CHAIN_ID} = require("../../constants");

const joeTokenAddress = "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd"
const wavaxTokenAddress = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"
const usdceTokenAddress = "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664"
const usdteTokenAddress = "0xc7198437980c041c805A1EDcbA50c1Ce5db95118"

const joeAvaxPair = "0x454E67025631C065d3cFAD6d71E6892f74487a15"
const wavaxUsdtePair = "0xeD8CBD9F0cE3C6986b22002F03c6475CEb7a6256"
const wavaxUsdcePair = "0xa389f9430876455c36478deea9769b7ca4e3ddb1"

const BN = require('bn.js');

const web3 = web3Factory(AVAX_CHAIN_ID);
const joeContract = new web3.eth.Contract(JoeContactABI, joeTokenAddress);
const usdceContract = new web3.eth.Contract(UsdceContractABI, usdceTokenAddress);
const usdteContract = new web3.eth.Contract(UsdteContractABI, usdteTokenAddress);
const wavaxContract = new web3.eth.Contract(WavaxContractABI, wavaxTokenAddress);

const e18 = new BN("10").pow(new BN("18"))

async function getReserves(token0ABI, token1ABI, pairAddress) {
    const _18 = new BN("18")
    const decimalToken0 = new BN(await token0ABI.methods.decimals().call())
    const decimalToken1 = new BN(await token1ABI.methods.decimals().call())
    const reserveToken0 = new BN(await token0ABI.methods.balanceOf(pairAddress).call()).mul(get10PowN(_18.sub(decimalToken0)))
    const reserveToken1 = new BN(await token1ABI.methods.balanceOf(pairAddress).call()).mul(get10PowN(_18.sub(decimalToken1)))
    return {reserveToken0, reserveToken1}
}

function get10PowN(n) {
    return new BN("10").pow(new BN(n.toString()))
}

async function getWavaxPriceUsdce() {
    const reserves = await getReserves(wavaxContract, usdceContract, wavaxUsdcePair)
    return reserves.reserveToken1.mul(e18).div(reserves.reserveToken0)
}


async function getWavaxPriceUsdte() {
    const reserves = await getReserves(wavaxContract, usdteContract, wavaxUsdtePair)
    return reserves.reserveToken1.mul(e18).div(reserves.reserveToken0)
}

async function avaxPrice(ctx) {
    ctx.body = (await getWavaxPriceUsdte()).toString() + " " + (await getWavaxPriceUsdce()).toString();
}

module.exports = {avaxPrice};
