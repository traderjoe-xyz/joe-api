'use strict';
const {web3Factory} = require("../../utils/web3");
const {AVAX_CHAIN_ID} = require("../../constants");
const web3 = web3Factory(AVAX_CHAIN_ID);
const BN = require('bn.js');
const tokenList = require('../../utils/tokenList.json')

// abis
const ERC20ContractABI = require('../../abis/ERC20ContractABI.json');
const JoeFactoryContractABI = require('../../abis/JoeFactoryContractABI.json');

// contracts address
const joeFactoryAddress = "0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10"

// tokens address
const wavaxTokenAddress = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"
const usdceTokenAddress = "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664"
const usdteTokenAddress = "0xc7198437980c041c805A1EDcbA50c1Ce5db95118"

// pairs address
const wavaxUsdtePair = "0xeD8CBD9F0cE3C6986b22002F03c6475CEb7a6256"
const wavaxUsdcePair = "0xA389f9430876455C36478DeEa9769B7Ca4E3DDB1"

// contracts
const usdceContract = getContractAsERC20(usdceTokenAddress);
const usdteContract = getContractAsERC20(usdteTokenAddress);
const wavaxContract = getContractAsERC20(wavaxTokenAddress);
const joefactory_contract = new web3.eth.Contract(JoeFactoryContractABI, joeFactoryAddress)

// constants
const E18 = new BN("10").pow(new BN("18"))
const EIGHTEEN = new BN("18")
const TWO = new BN("2")

function getContractAsERC20(tokenAddress) {
    return new web3.eth.Contract(ERC20ContractABI, tokenAddress)
}

async function getReserves(token0Contract, token1Contract, pairAddress) {
    const results = await Promise.all([
        token0Contract.methods.decimals().call(),
        token1Contract.methods.decimals().call(),
        token0Contract.methods.balanceOf(pairAddress).call(),
        token1Contract.methods.balanceOf(pairAddress).call()
    ])
    const reserveToken0 = new BN(results[2]).mul(get10PowN(EIGHTEEN.sub(new BN(results[0]))))
    const reserveToken1 = new BN(results[3]).mul(get10PowN(EIGHTEEN.sub(new BN(results[1]))))
    return {reserveToken0, reserveToken1}
}

function get10PowN(n) {
    return new BN("10").pow(new BN(n.toString()))
}

async function getDerivedPriceOfPair(token0Contract, token1Contract, pairAddress, fromToken0) {
    const reserves = await getReserves(token0Contract, token1Contract, pairAddress)
    return (fromToken0 === true ?
            reserves.reserveToken1.mul(E18).div(reserves.reserveToken0) :
            reserves.reserveToken0.mul(E18).div(reserves.reserveToken1)
    )
}

async function getAvaxPrice() {
    const results = await Promise.all([
        getDerivedPriceOfPair(wavaxContract, usdceContract, wavaxUsdcePair, true),
        getDerivedPriceOfPair(wavaxContract, usdteContract, wavaxUsdtePair, true)
    ])
    return new BN(results[0].add(results[1]).div(TWO).toString())
}

async function getPrice(tokenAddress) {
    const results = await Promise.all([
        getDerivedPrice(tokenAddress),
        getAvaxPrice()
    ])
    return results[0].mul(results[1]).div(E18)
}

async function getDerivedPrice(tokenAddress) {
    const results = await Promise.all([
        getContractAsERC20(tokenAddress),
        await getPairAddress(tokenAddress)

    ])
    if (results[1] === "0x0000000000000000000000000000000000000000")
        throw 'Error: Given address "' + tokenAddress + '" isn\'t paired with WAVAX on TraderJoe.'
    const derivedPrice = await getDerivedPriceOfPair(wavaxContract, results[0], results[1], false)
    return new BN(derivedPrice)
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
    let tokenAddress;
    if (!("tokenAddress" in ctx.params))
        ctx.body = ""
    else {
        try {
            if (ctx.params.tokenAddress in tokenList) {
                tokenAddress = tokenList[ctx.params.tokenAddress]
            } else {
                tokenAddress = web3.utils.toChecksumAddress(ctx.params.tokenAddress)
            }
        } catch (e) {
            ctx.body = e.toString()
        }
        tokenAddress === wavaxTokenAddress ?
            ctx.body = (await getAvaxPrice()).toString() :
            ctx.body = (await getPrice(tokenAddress)).toString()
    }
}

async function derivedPriceOfToken(ctx) {
    let tokenAddress;
    if (!("tokenAddress" in ctx.params))
        ctx.body = ""
    else {
        try {
            if (ctx.params.tokenAddress in tokenList) {
                tokenAddress = tokenList[ctx.params.tokenAddress]
            } else {
                tokenAddress = web3.utils.toChecksumAddress(ctx.params.tokenAddress)
            }
        } catch (e) {
            ctx.body = e.toString()
        }
        tokenAddress === wavaxTokenAddress ?
            ctx.body = E18.toString() :
            ctx.body = (await getDerivedPrice(tokenAddress)).toString()
    }
}

module.exports = {priceOfToken, derivedPriceOfToken};
