FROM mhart/alpine-node

RUN apk update && apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

COPY package.json package.json
RUN yarn --production

COPY . .
CMD ["npm", "start"]
