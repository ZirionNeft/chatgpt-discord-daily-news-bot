FROM node:18-alpine

RUN apk add g++ make python3

RUN corepack enable & corepack prepare yarn@stable --activate

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY src ./src
COPY tsconfig*.json ./

RUN npx tsc -p tsconfig.json

CMD ["yarn", "start"]
