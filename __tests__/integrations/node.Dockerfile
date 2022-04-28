FROM node:16

ADD . /src

# Build node sdk
WORKDIR /src/packages/node
RUN npm ci --ignore-scripts
RUN npm run build

# Install top level dependencies
WORKDIR /src
RUN npm ci
