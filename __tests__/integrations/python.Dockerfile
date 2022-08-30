FROM python:3 AS build-env

ADD packages/python /src
WORKDIR /src
RUN pip3 install --no-cache-dir -r requirements.txt

WORKDIR /src/examples/flask
RUN pip3 install --no-cache-dir -r requirements.txt

# Build runtime image
# TODO add this to base.Dockerfile?
FROM node:16
WORKDIR /src
ADD package*.json /src/
RUN npm ci
ADD __tests__ /src/__tests__

COPY --from=build-env /src /src
# Pip installs it's packages in some global location 🤷‍♂️
COPY --from=build-env /usr/local/ /usr/local/
