'use strict';

function getInfos(ctx) {
    if (!("id" in ctx.params))
        return {"name": "Joe Hat NFT"};
    else {
        return {
            "id": ctx.params.id,
            "external_url": "https://api.traderjoexyz.com/nft/hat/" + ctx.params.id,
            "name": "Joe Hat NFT #" + ctx.params.id,
            "description": "Redeemed a real HAT and burned 1 $HAT",
            "image": "https://ipfs.io/ipfs/QmaYPV2VKW5vHtD92m8h9Q4YFiukFx2fBWPAfCWKg6513s"
        }
    }
}

function infos(ctx) {
    ctx.body = getInfos(ctx)
}

module.exports = {infos};
