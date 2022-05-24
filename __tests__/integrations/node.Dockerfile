FROM node:16

ADD packages/node /src/packages/node

# Build node sdk
WORKDIR /src/packages/node
RUN npm ci --ignore-scripts
RUN npm run build

# Install example dependencies
WORKDIR /src/packages/node/examples/express
ADD packages/node/examples/express/package*.json .
RUN npm ci

WORKDIR /src/packages/node/examples/hapi
ADD packages/node/examples/hapi/package*.json .
RUN npm ci

# Install top level dependencies
WORKDIR /src
ADD __tests__ .
ADD package*.json .
RUN npm ci
