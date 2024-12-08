FROM node:22-alpine

RUN apk add g++ make python3

RUN corepack enable & corepack prepare yarn@4.5.0 --activate

WORKDIR /usr/src/app

COPY package.json yarn.lock .yarnrc.yml .swcrc ./

RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn install --frozen-lockfile

COPY src ./src
COPY tsconfig.json ./

RUN yarn build

CMD ["yarn", "start"]
