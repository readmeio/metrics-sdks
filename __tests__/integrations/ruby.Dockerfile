FROM alpine:3.16

COPY packages/ruby /src

RUN apk update
RUN apk add \
  # Need the -dev package and build-base to build native deps
  ruby-dev build-base \
  # git required for bundler
  git \
  # Alpine linux does not contain timezone data
  # https://tips.tutorialhorizon.com/2017/08/29/tzinfodatasourcenotfound-when-using-alpine-with-docker/
  tzdata \
  # rails needs sqlite
  sqlite-dev \
  nodejs npm
RUN gem install bundler

# Set up the Ruby SDK
WORKDIR /src
RUN bundle config set --local deployment true
RUN bundle install

# Install example dependencies
WORKDIR /src/examples/metrics-rails
RUN bundle config set --local deployment true
RUN bundle install

# Install top level dependencies
WORKDIR /src
COPY __tests__ /src/__tests__
COPY package*.json /src/
RUN npm ci
