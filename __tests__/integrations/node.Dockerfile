FROM node:16

RUN apt-get update -qq

ADD . /src
WORKDIR /src
