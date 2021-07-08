'use strict';

const Router = require('koa-router');
const router = new Router();

const noop = require('./api/noop');
const supply = require('./api/supply');

router.get('/circulating-supply', supply.circulatingSupply);
router.get('/total-supply', supply.totalSupply);
router.get('/', noop);

module.exports = router;
