FROM alpine:3.16

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
    php81-pdo \
    php81-phar \
    php81-session \
    php81-simplexml \
    php81-tokenizer \
    php81-xml \
    php81-xmlwriter 
RUN ln /usr/bin/php81 /usr/bin/php

# Install Composer
COPY --from=composer /usr/bin/composer /usr/bin/composer

# Set up the PHP SDK
WORKDIR /src/packages/php
ADD packages/php/composer*.json ./
RUN composer install

# Install Laravel
WORKDIR /src/packages/php/examples/laravel
ADD packages/php/examples/laravel/composer*.json ./
RUN composer install

CMD ["php", "artisan", "serve", "--host=0.0.0.0"]
