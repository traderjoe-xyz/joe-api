"use strict";

const Koa = require("koa");
const helmet = require("koa-helmet");
const body = require("koa-bodyparser");
const cors = require("@koa/cors");
const conditional = require("koa-conditional-get");
const etag = require("koa-etag");

const rt = require("./middleware/rt");
const powered = require("./middleware/powered");
const router = require("./router");
const logger = require("koa-logger");

const index = new Koa();
const is_dev = process.env.NODE_ENV === "dev";

if (!is_dev) {
  console.log("Running in production mode");
  console.info = () => {};
  console.debug = () => {};
  console.warn = () => {};
}

index.use(logger());
index.use(rt);
index.use(conditional());
index.use(etag());
index.use(helmet());
index.use(cors({ origin: "*" }));
index.use(powered);
index.use(body());

index.context.cache = {};

index.use(router.routes());
index.use(router.allowedMethods());

const port = process.env.PORT || 3000;
index.listen(port);
console.log(`> joe-api running! (:${port})`);
