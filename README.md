# Trader Joe API

API that gives information on $JOE supply for coingecko.

---

## To Run
```
> yarn
> yarn start
...
yarn run v1.22.17
$ node index.ts
Running in production mode
> joe-api running! (:3000)
  <-- GET /priceavax/avax
  --> GET /priceavax/avax 304 6ms
```

## For Debugging
```
❯ yarn dev
...
yarn run v1.22.17
$ NODE_ENV=dev node index.ts
> joe-api running! (:3000)
  <-- GET /priceavax/avax
logics
found in token list [ 'aavaxb', 'ape-x', 'apein', 'aurora', 'avax' ] ...
  --> GET /priceavax/avax 304 11ms
```
---
---

## Endpoints

---

#### **/supply/total**: Used by [Coingecko](https://coingecko.com) to display Joe's total supply.
#### **/supply/circulating**: Used by [Coingecko](https://coingecko.com) to display Joe's circulating supply.
#### **/supply/max**: Used by [Coingecko](https://coingecko.com) to display Joe's max supply.
#### **/priceavax/token**: Used to display current derived price of token. **token** needs to be an address or the symbol of a token with enough liquidity.
#### **/priceusd/token**: Used to display current price in usdt of token. **token** needs to be an address or the symbol of a token with enough liquidity.

---
---

## License

[MIT](LICENSE)
