FROM node:18

ADD packages/node /src/packages/node

# Build Node SDK
WORKDIR /src/packages/node
RUN npm i --ignore-scripts
RUN npm run build

# Install hapi
WORKDIR /src/packages/node/examples/hapi
ADD packages/node/examples/hapi/package*.json ./
RUN npm i

CMD ["node", "index.js"]
