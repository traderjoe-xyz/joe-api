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
            "image": "https://bafybeifvjx7u2zidkkt27njgtky5hfrsjnh5dhj6uy4io4imo2nrej6b6y.ipfs.dweb.link/?filename=logo.png",
            "ips": "https://bafybeifvjx7u2zidkkt27njgtky5hfrsjnh5dhj6uy4io4imo2nrej6b6y.ipfs.dweb.link/?filename=logo.png"
        }
    }
}

function infos(ctx) {
    ctx.body = getInfos(ctx)
}

module.exports = {infos};
