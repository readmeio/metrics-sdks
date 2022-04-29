FROM node:16

ADD packages/node /src/packages/node

# Build node sdk
WORKDIR /src/packages/node
RUN npm ci --ignore-scripts
RUN npm run build

# Install top level dependencies
WORKDIR /src
ADD package*.json /src/
RUN npm ci
ADD __tests__ /src/__tests__
