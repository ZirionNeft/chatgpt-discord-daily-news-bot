FROM node:18-alpine

RUN apk add g++ make python3

RUN corepack enable & corepack prepare yarn@stable --activate

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn install --frozen-lockfile

COPY src ./src
COPY tsconfig*.json ./

RUN yarn tsc -p tsconfig.json

CMD ["yarn", "start"]
