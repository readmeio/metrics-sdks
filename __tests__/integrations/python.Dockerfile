FROM alpine:3.16

COPY packages/python /src

RUN apk update
RUN apk add python3 py3-pip nodejs npm

# Set up the Python SDK
WORKDIR /src
RUN pip3 install --no-cache-dir -r requirements.txt

# Install example dependencies
WORKDIR /src/examples/flask
RUN pip3 install --no-cache-dir -r requirements.txt

WORKDIR /src/examples/metrics_django
RUN pip3 install --no-cache-dir -r requirements.txt

# Install top level dependencies
WORKDIR /src
COPY __tests__ /src/__tests__
COPY package*.json /src/
RUN npm ci
