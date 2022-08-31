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
# Without these I get some error about shared libraries being missing:
# python3: error while loading shared libraries: libpython3.10.so.1.0: cannot open shared object file: No such file or directory
#COPY --from=build-env /lib /lib
#ENV LD_LIBRARY_PATH=/lib:/usr/lib:/usr/local/lib
