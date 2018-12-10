FROM node:10-alpine

COPY package*.json .
COPY yarn.lock .
RUN yarn

COPY build build
COPY static static

ENV NODE_ENV production

ENTRYPOINT ["node", "build/bin/app.js"]