FROM alpine

ADD packages/php src/packages/php

RUN apk update
RUN apk add php81 \
    php81-curl \
    php81-dom \
    php81-fileinfo \
    php81-fpm \
    php81-mbstring \
    php81-opcache \
    php81-openssl \
    php81-phar \
    php81-simplexml \
    php81-tokenizer \
    php81-xml \
    php81-xmlwriter
RUN apk add --update nodejs npm curl
RUN ln /usr/bin/php81 /usr/bin/php

# Install Composer
COPY --from=composer /usr/bin/composer /usr/bin/composer

# Set up the PHP SDK
WORKDIR /src/packages/php
ADD packages/php/composer*.json ./
RUN composer install

# Install example dependencies
WORKDIR /src/packages/php/examples/laravel
ADD packages/php/examples/laravel/composer*.json ./
RUN composer install

# # Install top level dependencies
WORKDIR /src
ADD __tests__ ./__tests__
ADD package*.json ./
RUN npm ci
RUN which php
RUN ls
RUN ls packages
RUN ls -lah packages/php
RUN ls -lah packages/php/examples
RUN ls -lah packages/php/examples/laravel

# Put the php executable in the path
ENV PATH /usr/bin/php:$PATH



###
# FROM php:8.1.8-fpm

# # Install Composer
# RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# ADD packages/php src/packages/php

# # Build PHP SDK
# WORKDIR /src/packages/php
# ADD packages/php/composer*.json ./
# RUN composer install

# # Install example dependencies
# WORKDIR /src/packages/php/examples/laravel
# ADD packages/php/examples/laravel/composer*.json ./
# RUN composer install

# # Install top level dependencies
# WORKDIR /src
# ADD __tests__ ./__tests__
# ADD package*.json ./
# RUN npm ci


#####
# FROM node:16

# ADD packages/node /src/packages/node

# # Build node sdk
# WORKDIR /src/packages/node
# RUN npm ci --ignore-scripts
# RUN npm run build

# # Install example dependencies
# WORKDIR /src/packages/node/examples/express
# ADD packages/node/examples/express/package*.json ./
# RUN npm ci

# WORKDIR /src/packages/node/examples/hapi
# ADD packages/node/examples/hapi/package*.json ./
# RUN npm ci

# WORKDIR /src/packages/node/examples/fastify
# ADD packages/node/examples/fastify/package*.json ./
# RUN npm ci

# # Install top level dependencies
# WORKDIR /src
# ADD __tests__ ./__tests__
# ADD package*.json ./
# RUN npm ci
