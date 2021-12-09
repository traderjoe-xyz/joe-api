"use strict";
const {
  AVAX_CHAIN_ID,
  BN_1E18,
  BN_18,
  BN_2,
  JOEFACTORY_ADDRESS,
  USDC_ADDRESS,
  USDT_ADDRESS,
  WAVAX_ADDRESS,
  WAVAX_USDC_ADDRESS,
  WAVAX_USDT_ADDRESS,
  ZERO_ADDRESS,
  JOE_ADDRESS,
  XJOE_ADDRESS,
} = require("../../constants");
const { web3Factory } = require("../../utils/web3");
const BN = require("bn.js");
const tokenList = require("../../utils/tokenList.json");
const web3 = web3Factory(AVAX_CHAIN_ID);

// abis
const ERC20ContractABI = require("../../abis/ERC20ContractABI.json");
const JoeBarContractABI = require("../../abis/JoeBarContractABI.json");
const JoeFactoryContractABI = require("../../abis/JoeFactoryContractABI.json");

// contracts
const joefactory_contract = new web3.eth.Contract(
  JoeFactoryContractABI,
  JOEFACTORY_ADDRESS
);

class Cache {
  minElapsedTimeInMs = 60000; // 60 seconds

  constructor() {
    this.pair = {};
    this.decimals = {};
    this.contract = {};
    this.cachedPrice = {};
  }

  async getPair(tokenAddress) {
    if (tokenAddress in this.pair) {
      return this.pair[tokenAddress];
    }

    const pairAddress = await getPairAddress(tokenAddress);

    if (pairAddress === ZERO_ADDRESS) {
      return pairAddress;
    }

    this.pair[tokenAddress] = pairAddress;
    return pairAddress;
  }

  async getDecimals(tokenAddress) {
    if (tokenAddress in this.decimals) {
      return this.decimals[tokenAddress];
    }

    const decimals = await this.getContract(tokenAddress)
      .methods.decimals()
      .call();

    this.decimals[tokenAddress] = decimals;
    return decimals;
  }

  getContract(tokenAddress) {
    if (tokenAddress in this.contract) {
      return this.contract[tokenAddress];
    }

    const tokenContract = getContractAsERC20(tokenAddress);
    this.contract[tokenAddress] = tokenContract;
    return tokenContract;
  }

  async getXJoePrice(derived) {
    console.info("getXJoePrice");
    if (
      !(
        XJOE_ADDRESS in this.cachedPrice &&
        this.cachedPrice[XJOE_ADDRESS].lastRequestTimestamp +
          this.minElapsedTimeInMs >
          Date.now()
      )
    ) {
      if (!(XJOE_ADDRESS in this.contract))
        this.contract[XJOE_ADDRESS] = new web3.eth.Contract(
          JoeBarContractABI,
          XJOE_ADDRESS
        );

      const joeBalance = new BN(
        await getContractAsERC20(JOE_ADDRESS)
          .methods.balanceOf(XJOE_ADDRESS)
          .call()
      );
      const totalSupply = new BN(
        await this.contract[XJOE_ADDRESS].methods.totalSupply().call()
      );

      const ratio = joeBalance.mul(BN_1E18).div(totalSupply);

      const lastRequestTimestamp = Date.now();
      const lastResult = (await this.getPrice(JOE_ADDRESS, true))
        .mul(ratio)
        .div(BN_1E18);

      this.cachedPrice[XJOE_ADDRESS] = { lastRequestTimestamp, lastResult };
    }

    return derived
      ? this.cachedPrice[XJOE_ADDRESS].lastResult
      : this.cachedPrice[XJOE_ADDRESS].lastResult
          .mul(await this.getAvaxPrice())
          .div(BN_1E18);
  }

  async getAvaxPrice() {
    console.info("getAvaxPrice");
    if (WAVAX_ADDRESS in this.cachedPrice) {
      if (
        this.cachedPrice[WAVAX_ADDRESS].lastRequestTimestamp +
          this.minElapsedTimeInMs >
        Date.now()
      ) {
        return this.cachedPrice[WAVAX_ADDRESS].lastResult;
      }
    }

    const result = await Promise.all([
      getReserves(WAVAX_ADDRESS, USDC_ADDRESS, WAVAX_USDC_ADDRESS),
      getReserves(WAVAX_ADDRESS, USDT_ADDRESS, WAVAX_USDT_ADDRESS),
    ]);

    const priceUSDCE = result[0].reserveToken1
      .mul(BN_1E18)
      .div(result[0].reserveToken0);
    const priceUSDTE = result[1].reserveToken1
      .mul(BN_1E18)
      .div(result[1].reserveToken0);

    const avaxPrice = priceUSDCE.add(priceUSDTE).div(BN_2);

    const lastRequestTimestamp = Date.now();
    const lastResult = avaxPrice;
    this.cachedPrice[WAVAX_ADDRESS] = { lastRequestTimestamp, lastResult };

    return avaxPrice;
  }

  async getPrice(tokenAddress, derived) {
    if (
      !(tokenAddress in this.cachedPrice) ||
      this.cachedPrice[tokenAddress].lastRequestTimestamp +
        this.minElapsedTimeInMs <
        Date.now() // check if price needs to be updated
    ) {
      const pairAddress = await cache.getPair(tokenAddress);

      if (pairAddress === ZERO_ADDRESS) {
        throw (
          'Error: Given address "' +
          tokenAddress +
          "\" isn't paired with WAVAX on TraderJoe."
        );
      }

      const reserves = derived
        ? await Promise.all([
            getReserves(WAVAX_ADDRESS, tokenAddress, pairAddress),
          ])
        : await Promise.all([
            getReserves(WAVAX_ADDRESS, tokenAddress, pairAddress),
            this.getAvaxPrice(),
          ]);
      const price = reserves[0].reserveToken0
        .mul(BN_1E18)
        .div(reserves[0].reserveToken1);

      const lastRequestTimestamp = Date.now();
      const lastResult = price;
      this.cachedPrice[tokenAddress] = { lastRequestTimestamp, lastResult };
    } else if (
      !(WAVAX_ADDRESS in this.cachedPrice) ||
      this.cachedPrice[WAVAX_ADDRESS].lastRequestTimestamp +
        this.minElapsedTimeInMs <
        Date.now()
    ) {
      // check if price needs to be updated)
      await this.getAvaxPrice();
    }

    return derived
      ? this.cachedPrice[tokenAddress].lastResult
      : this.cachedPrice[WAVAX_ADDRESS].lastResult
          .mul(this.cachedPrice[tokenAddress].lastResult)
          .div(BN_1E18);
  }
}

function getContractAsERC20(tokenAddress) {
  return new web3.eth.Contract(ERC20ContractABI, tokenAddress);
}

async function getReserves(token0Address, token1Address, pairAddress) {
  const results = await Promise.all([
    cache.getDecimals(token0Address),
    cache.getDecimals(token1Address),
    cache.getContract(token0Address).methods.balanceOf(pairAddress).call(),
    cache.getContract(token1Address).methods.balanceOf(pairAddress).call(),
  ]);
  const reserveToken0 = new BN(results[2]).mul(
    get10PowN(BN_18.sub(new BN(results[0])))
  );
  const reserveToken1 = new BN(results[3]).mul(
    get10PowN(BN_18.sub(new BN(results[1])))
  );

  return { reserveToken0, reserveToken1 };
}

function get10PowN(n) {
  return new BN("10").pow(new BN(n.toString()));
}

async function getPrice(tokenAddress, derived) {
  if (tokenAddress === WAVAX_ADDRESS) {
    return await cache.getAvaxPrice();
  }
  if (tokenAddress === XJOE_ADDRESS) {
    return await cache.getXJoePrice(derived);
  }

  return await cache.getPrice(tokenAddress, derived);
}

async function getPairAddress(tokenAddress) {
  return tokenAddress
    ? tokenAddress > WAVAX_ADDRESS
      ? await joefactory_contract.methods
          .getPair(tokenAddress, WAVAX_ADDRESS)
          .call()
      : await joefactory_contract.methods
          .getPair(WAVAX_ADDRESS, tokenAddress)
          .call()
    : undefined;
}

async function logics(ctx, derived) {
  console.info("logics");
  let tokenAddress;
  if (!("tokenAddress" in ctx.params)) ctx.body = "";
  else {
    try {
      if (ctx.params.tokenAddress in tokenList) {
        console.info(
          "found in token list",
          Object.keys(tokenList).slice(0, 5),
          "..."
        );
        tokenAddress = tokenList[ctx.params.tokenAddress];
      } else {
        tokenAddress = web3.utils.toChecksumAddress(ctx.params.tokenAddress);
      }

      derived
        ? tokenAddress === WAVAX_ADDRESS
          ? (ctx.body = BN_1E18.toString())
          : (ctx.body = (await getPrice(tokenAddress, derived)).toString())
        : (ctx.body = (await getPrice(tokenAddress, derived)).toString());
    } catch (e) {
      ctx.body = e.toString();
    }
  }
}

async function priceOfToken(ctx) {
  await logics(ctx, false);
}

async function derivedPriceOfToken(ctx) {
  await logics(ctx, true);
}

const cache = new Cache();
module.exports = { priceOfToken, derivedPriceOfToken };
