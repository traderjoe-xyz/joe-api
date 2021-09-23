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
const joefactory_contract = new web3.eth.Contract(JoeFactoryContractABI, joeFactoryAddress)

// constants
const E18 = new BN("10").pow(new BN("18"))
const EIGHTEEN = new BN("18")
const TWO = new BN("2")
const zeroAddress = "0x0000000000000000000000000000000000000000"


class Cache {
    minElapsedTimeInMs = 60000; // 60 seconds

    constructor() {
        this.pair = {}
        this.decimals = {}
        this.contract = {}
        this.cachedPrice = {}
    }

    async getPair(tokenAddress) {
        if (tokenAddress in this.pair) {
            return this.pair[tokenAddress]
        }
        console.log("getPair", tokenAddress)
        const pairAddress = await getPairAddress(tokenAddress)

        if (pairAddress === zeroAddress) {
            return pairAddress
        }

        this.pair[tokenAddress] = pairAddress
        return pairAddress
    }

    async getDecimals(tokenAddress) {
        if (tokenAddress in this.decimals) {
            return this.decimals[tokenAddress]
        }
        console.log("getDecimals", tokenAddress)
        const decimals = await this.getContract(tokenAddress).methods.decimals().call()

        this.decimals[tokenAddress] = decimals
        return decimals
    }

    getContract(tokenAddress) {
        if (tokenAddress in this.contract) {
            return this.contract[tokenAddress]
        }
        console.log("getContract", tokenAddress)
        const tokenContract = getContractAsERC20(tokenAddress)
        this.contract[tokenAddress] = tokenContract
        return tokenContract
    }

    async getAvaxPrice() {
        if (wavaxTokenAddress in this.cachedPrice) {
            if (this.cachedPrice[wavaxTokenAddress].lastRequestTimestamp + this.minElapsedTimeInMs > Date.now()) {
                return this.cachedPrice[wavaxTokenAddress].lastResult
            }
        }
        console.log("getAvaxPrice")
        const reservesUSDCE = await getReserves(wavaxTokenAddress, usdceTokenAddress, wavaxUsdcePair)
        const reservesUSDTE = await getReserves(wavaxTokenAddress, usdteTokenAddress, wavaxUsdtePair)

        const priceUSDCE = reservesUSDCE.reserveToken1.mul(E18).div(reservesUSDCE.reserveToken0)
        const priceUSDTE = reservesUSDTE.reserveToken1.mul(E18).div(reservesUSDTE.reserveToken0)

        const avaxPrice = priceUSDCE.add(priceUSDTE).div(TWO)

        const lastRequestTimestamp = Date.now()
        const lastResult = avaxPrice
        this.cachedPrice[wavaxTokenAddress] = {lastRequestTimestamp, lastResult}

        return avaxPrice
    }

    async getPrice(tokenAddress, derived) {
        if (!(tokenAddress in this.cachedPrice) ||
            this.cachedPrice[tokenAddress].lastRequestTimestamp + this.minElapsedTimeInMs < Date.now() // check if price needs to be updated
        ) {
            console.log("getPrice", tokenAddress, derived)
            const pairAddress = await cache.getPair(tokenAddress)

            if (pairAddress === zeroAddress) {
                throw 'Error: Given address "' + tokenAddress + '" isn\'t paired with WAVAX on TraderJoe.'
            }

            const reserves = await getReserves(wavaxTokenAddress, tokenAddress, pairAddress)

            const price = reserves.reserveToken0.mul(E18).div(reserves.reserveToken1)

            const lastRequestTimestamp = Date.now()
            const lastResult = price
            this.cachedPrice[tokenAddress] = {lastRequestTimestamp, lastResult}
        }

        return derived ?
            this.cachedPrice[tokenAddress].lastResult :
            (await this.getAvaxPrice()).mul(this.cachedPrice[tokenAddress].lastResult).div(E18)
    }
}

function getContractAsERC20(tokenAddress) {
    return new web3.eth.Contract(ERC20ContractABI, tokenAddress)
}

async function getReserves(token0Address, token1Address, pairAddress) {
    const balanceToken0 = await cache.getContract(token0Address).methods.balanceOf(pairAddress).call()
    const balanceToken1 = await cache.getContract(token1Address).methods.balanceOf(pairAddress).call()

    const decimalsToken0 = await cache.getDecimals(token0Address)
    const decimalsToken1 = await cache.getDecimals(token1Address)

    const reserveToken0 = new BN(balanceToken0).mul(get10PowN(EIGHTEEN.sub(new BN(decimalsToken0))))
    const reserveToken1 = new BN(balanceToken1).mul(get10PowN(EIGHTEEN.sub(new BN(decimalsToken1))))
    return {reserveToken0, reserveToken1}
}

function get10PowN(n) {
    return new BN("10").pow(new BN(n.toString()))
}

async function getPrice(tokenAddress, derived) {
    if (tokenAddress === wavaxTokenAddress) {
        return await cache.getAvaxPrice()
    }

    return await cache.getPrice(tokenAddress, derived)
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

async function logics(ctx, derived) {
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

            console.log("logics", tokenAddress)

            derived ?
                tokenAddress === wavaxTokenAddress ?
                    ctx.body = E18.toString() :
                    ctx.body = (await getPrice(tokenAddress, derived)).toString() :
                ctx.body = (await getPrice(tokenAddress, derived)).toString()

        } catch (e) {
            ctx.body = e.toString()
        }
    }
}

async function priceOfToken(ctx) {
    await logics(ctx, false)
}

async function derivedPriceOfToken(ctx) {
    await logics(ctx, true)
}

const cache = new Cache()
module.exports = {priceOfToken, derivedPriceOfToken};
