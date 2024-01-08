FROM node:18

ADD packages/node /src/packages/node

# Build Node SDK
WORKDIR /src/packages/node
RUN npm ci --ignore-scripts
RUN npm run build

# Install Express
WORKDIR /src/packages/node/examples/express
ADD packages/node/examples/express/package*.json ./
RUN npm ci

CMD ["node", "index.js"]
