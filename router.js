'use strict';

const Router = require('koa-router');
const router = new Router();

const noop = require('./api/noop');
const supply = require('./api/supply');
const nftHat = require('./api/nft/hat');
const price = require('./api/price');

router.get('/supply/circulating', supply.circulatingSupply);
router.get('/supply/total', supply.totalSupply);
router.get('/supply/max', supply.maxSupply);
router.get('/nft/hat', nftHat.infos);
router.get('/nft/hat/:id', nftHat.infos)
router.get('/priceavax/:tokenAddress', price.derivedPriceOfToken)
router.get('/priceusd/:tokenAddress', price.priceOfToken)
router.get('/', noop);

module.exports = router;
