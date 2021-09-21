'use strict';

const {web3Factory} = require("../../utils/web3");
const JoeContactABI = require('../../abis/JoeContactABI.json');
const UsdceContractABI = require('../../abis/UsdceContractABI.json');
const UsdteContractABI = require('../../abis/UsdteContractABI.json');
const WavaxContractABI = require('../../abis/WavaxContractABI.json');
const JoeFactoryContractABI = require('../../abis/JoeFactoryContractABI.json');
const {AVAX_CHAIN_ID} = require("../../constants");

const joeTokenAddress = "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd"
const wavaxTokenAddress = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"
const usdceTokenAddress = "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664"
const usdteTokenAddress = "0xc7198437980c041c805A1EDcbA50c1Ce5db95118"
const joeFactoryAddress = "0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10"

const joeWavaxPair = "0x454E67025631C065d3cFAD6d71E6892f74487a15"
const wavaxUsdtePair = "0xeD8CBD9F0cE3C6986b22002F03c6475CEb7a6256"
const wavaxUsdcePair = "0xA389f9430876455C36478DeEa9769B7Ca4E3DDB1"

const BN = require('bn.js');

const web3 = web3Factory(AVAX_CHAIN_ID);
const joeContract = new web3.eth.Contract(JoeContactABI, joeTokenAddress);
const usdceContract = new web3.eth.Contract(UsdceContractABI, usdceTokenAddress);
const usdteContract = new web3.eth.Contract(UsdteContractABI, usdteTokenAddress);
const wavaxContract = new web3.eth.Contract(WavaxContractABI, wavaxTokenAddress);
const joefactory_contract = new web3.eth.Contract(JoeFactoryContractABI, joeFactoryAddress)

const e18 = new BN("10").pow(new BN("18"))
const _18 = new BN("18")
const _2 = new BN("2")

async function getReserves(token0Contract, token1Contract, pairAddress) {
    const results = await Promise.all([
        token0Contract.methods.decimals().call(),
        token1Contract.methods.decimals().call(),
        token0Contract.methods.balanceOf(pairAddress).call(),
        token1Contract.methods.balanceOf(pairAddress).call()
    ])
    const reserveToken0 = new BN(results[2]).mul(get10PowN(_18.sub(new BN(results[0]))))
    const reserveToken1 = new BN(results[3]).mul(get10PowN(_18.sub(new BN(results[1]))))
    return {reserveToken0, reserveToken1}
}

function get10PowN(n) {
    return new BN("10").pow(new BN(n.toString()))
}

async function getDerivedPrice(token0Contract, token1Contract, pairAddress, fromToken0) {
    const reserves = await getReserves(token0Contract, token1Contract, pairAddress)
    return (fromToken0 === true ?
            reserves.reserveToken1.mul(e18).div(reserves.reserveToken0) :
            reserves.reserveToken0.mul(e18).div(reserves.reserveToken1)
    )
}

async function getAvaxPrice() {
    const results = await Promise.all([
        getDerivedPrice(wavaxContract, usdceContract, wavaxUsdcePair, true),
        getDerivedPrice(wavaxContract, usdteContract, wavaxUsdtePair, true)
    ])
    return results[0].add(results[1]).div(_2).toString()
}

async function getJoeDerivedPrice() {
    return (await getDerivedPrice(wavaxContract, joeContract, joeWavaxPair, false)).toString()
}

async function getPriceOfToken(symbol) {
    const results = await Promise.all([
        getDerivedPrice(wavaxContract, joeContract, joeWavaxPair, false),
        getAvaxPrice()
    ])
    return results[0] BN.mul(BN)
}

async function getTokenAddress(symbol) {

    return undefined
}

async function getPairAddress(tokenAddress) {
    return (
        tokenAddress ?
            (tokenAddress > wavaxTokenAddress) ?
                await joefactory_contract.methods.getPair(tokenAddress, wavaxTokenAddress).call() :
                await joefactory_contract.methods.getPair(wavaxTokenAddress, tokenAddress).call()
            : undefined
    )
}

async function priceOfToken(ctx) {
    if (!("token" in ctx.params))
        ctx.body = "10"
    else {
        ctx.body = await getJoeDerivedPrice()
    }
}

async function derivedPriceOfToken(ctx) {
    console.log(ctx.params.token)
    if (!("token" in ctx.params))
        ctx.body = "12"
    else {
        ctx.body = await getAvaxPrice()
    }
}

module.exports = {priceOfToken, derivedPriceOfToken};
