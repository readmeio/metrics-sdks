FROM node:16

ADD packages/node /src/packages/node

# Build Node SDK
WORKDIR /src/packages/node
RUN npm ci --ignore-scripts
RUN npm run build

# Install hapi
WORKDIR /src/packages/node/examples/hapi
ADD packages/node/examples/hapi/package*.json ./
RUN npm ci

CMD ["node", "index.js"]
