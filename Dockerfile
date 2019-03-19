FROM node:10-alpine

RUN apk add --update perl && rm -rf /var/cache/apk/*

COPY package*.json .
COPY yarn.lock .
RUN yarn

COPY . .

ENV NODE_ENV production

ENTRYPOINT ["yarn", "start", "demimonde.app"]