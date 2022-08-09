FROM 194943407731.dkr.ecr.eu-west-1.amazonaws.com/node:latest
# FROM node:18.7.0-alpine3.16

WORKDIR /app
COPY package.json /app/

RUN yarn && yarn install

COPY abis /app/abis
COPY api /app/api
COPY middleware /app/middleware
COPY utils /app/utils
COPY constants.js /app/
COPY index.ts /app/
COPY router.js /app/

CMD ["node", "./index.ts"]
