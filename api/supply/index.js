"use strict";

const {
  AVAX_CHAIN_ID,
  BN_1E18,
  BURN_ADDRESS,
  JOE_ADDRESS,
  TEAM_TREASURY_WALLETS,
  LOCKING_WRAPPER_ADDRESS,
} = require("../../constants");
const { web3Factory } = require("../../utils/web3");
const BN = require("bn.js");
const JoeContractABI = require("../../abis/JoeTokenContractABI.json");
const LockingWrapperABI = require("../../abis/LockingWrapperABI.json");

const web3 = web3Factory(AVAX_CHAIN_ID);
const joeContract = new web3.eth.Contract(JoeContractABI, JOE_ADDRESS);
const lockingWrapperContract = new web3.eth.Contract(
  LockingWrapperABI,
  LOCKING_WRAPPER_ADDRESS
);

class Cache {
  minElapsedTimeInMs = 10000; // 10 seconds

  constructor() {
    this.cachedCirculatingSupply = undefined;
    this.cachedMaxSupply = undefined;
    this.cachedTotalSupply = undefined;
  }

  async getTotalSupply() {
    if (
      !this.cachedTotalSupply ||
      this.cachedTotalSupply.lastRequestTimestamp + this.minElapsedTimeInMs <
        Date.now() // check if supply needs to be updated
    ) {
      const totalSupply = new BN(
        await joeContract.methods.totalSupply().call()
      ).sub(new BN(await getBalanceOf(BURN_ADDRESS))); // Remove burned supply
      const lastRequestTimestamp = Date.now();
      this.cachedTotalSupply = { totalSupply, lastRequestTimestamp };
    }

    return this.cachedTotalSupply.totalSupply;
  }

  async getMaxSupply() {
    if (!this.cachedMaxSupply) {
      const maxSupply = new BN(await joeContract.methods.maxSupply().call());
      const lastRequestTimestamp = Date.now();
      this.cachedMaxSupply = { maxSupply, lastRequestTimestamp };
    }
    return this.cachedMaxSupply.maxSupply;
  }

  async getCirculatingSupply() {
    if (
      !this.cachedCirculatingSupply ||
      this.cachedCirculatingSupply.lastRequestTimestamp +
        this.minElapsedTimeInMs <
        Date.now() // check if supply needs to be updated
    ) {
      const teamTreasuryBalances = TEAM_TREASURY_WALLETS.map((wallet) =>
        getBalanceOf(wallet)
      );
      const results = await Promise.all([
        this.getTotalSupply(),
        ...teamTreasuryBalances,
        lockingBalance(),
      ]);

      let circulatingSupply = new BN(results[0]);
      for (let i = 1; i < results.length; i++) {
        circulatingSupply = circulatingSupply.sub(new BN(results[i]));
      }

      const lastRequestTimestamp = Date.now();
      this.cachedCirculatingSupply = {
        circulatingSupply,
        lastRequestTimestamp,
      };
    }
    return this.cachedCirculatingSupply.circulatingSupply;
  }
}

async function lockingBalance() {
  return await lockingWrapperContract.methods.balanceOf().call();
}

async function getBalanceOf(address) {
  return await joeContract.methods.balanceOf(address).call();
}

async function circulatingSupply(ctx) {
  ctx.body = (await cache.getCirculatingSupply()).toString();
}

async function circulatingSupplyAdjusted(ctx) {
  ctx.body = (await cache.getCirculatingSupply()).div(BN_1E18).toString();
}

async function circulatingSupplyAdjustedFloat (ctx) {
  const supply = await cache.getCirculatingSupply();
  ctx.body = `${supply.div(BN_1E18)}.${supply.mod(BN_1E18)}`;
}

async function maxSupply(ctx) {
  ctx.body = (await cache.getMaxSupply()).toString();
}

async function totalSupply(ctx) {
  ctx.body = (await cache.getTotalSupply()).toString();
}

const cache = new Cache();
module.exports = {
  circulatingSupply,
  circulatingSupplyAdjusted,
  circulatingSupplyAdjustedFloat,
  totalSupply,
  maxSupply,
};
