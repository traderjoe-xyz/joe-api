'use strict';

const {web3Factory} = require("../../utils/web3");
const JoeContractABI = require('../../abis/JoeTokenContractABI.json');
const {_1E18, AVAX_CHAIN_ID} = require("../../constants");
const joeTokenAddress = "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd"
const BN = require('bn.js');

const web3 = web3Factory(AVAX_CHAIN_ID);
const joeContract = new web3.eth.Contract(JoeContractABI, joeTokenAddress);


class Cache {
    minElapsedTimeInMs = 10000; // 10 seconds

    constructor() {
        this.cachedCirculatingSupply = undefined
        this.cachedMaxSupply = undefined
        this.cachedTotalSupply = undefined
    }


    async getTotalSupply() {
        if (!this.cachedTotalSupply ||
            this.cachedTotalSupply.lastRequestTimestamp + this.minElapsedTimeInMs < Date.now() // check if supply needs to be updated
        ) {
            const totalSupply = new BN(await joeContract.methods.totalSupply().call());
            const lastRequestTimestamp = Date.now();
            this.cachedTotalSupply = {totalSupply, lastRequestTimestamp}
        }

        return this.cachedTotalSupply.totalSupply
    }

    async getMaxSupply() {
        if (!this.cachedMaxSupply) {
            const maxSupply = new BN(await joeContract.methods.maxSupply().call());
            const lastRequestTimestamp = Date.now();
            this.cachedMaxSupply = {maxSupply, lastRequestTimestamp}
        }
        return this.cachedMaxSupply.maxSupply
    }

    async getCirculatingSupply() {
        if (!this.cachedCirculatingSupply ||
            this.cachedCirculatingSupply.lastRequestTimestamp + this.minElapsedTimeInMs < Date.now() // check if supply needs to be updated
        ) {
            const results = await Promise.all([
                this.getTotalSupply(),
                getBalanceOf("0xaFF90532E2937fF290009521e7e120ed062d4F34"),
                getBalanceOf("0x66Fb02746d72bC640643FdBa3aEFE9C126f0AA4f"),
                getBalanceOf("0xc13B1C927565C5AF8fcaF9eF7387172c447f6796")
            ])

            const circulatingSupply = new BN(results[0]).sub(new BN(results[1])).sub(new BN(results[2])).sub(new BN(results[3]))

            const lastRequestTimestamp = Date.now();
            this.cachedCirculatingSupply = {circulatingSupply, lastRequestTimestamp}
        }
        return this.cachedCirculatingSupply.circulatingSupply
    }
}

async function getBalanceOf(address) {
    return await joeContract.methods.balanceOf(address).call();
}

async function circulatingSupply(ctx) {
    ctx.body = (await cache.getCirculatingSupply()).toString();
}

async function circulatingSupplyAdjusted(ctx) {
    ctx.body = ((await cache.getCirculatingSupply()).div(_1E18)).toString();
}

async function maxSupply(ctx) {
    ctx.body = (await cache.getMaxSupply()).toString();
}


async function totalSupply(ctx) {
    ctx.body = (await cache.getTotalSupply()).toString();
}

const cache = new Cache()
module.exports = {circulatingSupply, circulatingSupplyAdjusted, totalSupply, maxSupply};
