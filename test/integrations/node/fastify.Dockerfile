FROM node:18

ADD packages/node /src/packages/node

# Build Node SDK
WORKDIR /src/packages/node
RUN npm i --ignore-scripts
RUN npm run build

# Install Fastify
WORKDIR /src/packages/node/examples/fastify
ADD packages/node/examples/fastify/package*.json ./
RUN npm i

CMD ["node", "index.js"]
