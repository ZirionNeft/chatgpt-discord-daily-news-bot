FROM node:18-alpine

RUN apk add g++ make python3

WORKDIR /usr/src/app

COPY package.json yarn-lock.json ./

RUN yarn install --frozen-lockfile

COPY src ./src
COPY tsconfig*.json ./

RUN npx tsc -p tsconfig.json

CMD ["yarn", "start"]
