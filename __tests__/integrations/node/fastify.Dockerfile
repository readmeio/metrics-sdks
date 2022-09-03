FROM node:16

ADD packages/node /src/packages/node

# Build node sdk
WORKDIR /src/packages/node
RUN npm ci --ignore-scripts
RUN npm run build

# Install Fastify
WORKDIR /src/packages/node/examples/fastify
ADD packages/node/examples/fastify/package*.json ./
RUN npm ci

CMD ["node", "index.js"]
