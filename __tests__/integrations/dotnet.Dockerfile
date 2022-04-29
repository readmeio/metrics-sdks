FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build-env 

ADD packages/dotnet /src

WORKDIR /src/examples/net6.0
RUN dotnet publish -o out

# Build runtime image
# TODO add this to base.Dockerfile?
FROM node:16
WORKDIR /src
ADD package*.json /src/
RUN npm ci
ADD __tests__ /src/__tests__

COPY --from=build-env /src /src
COPY --from=build-env /usr/share/dotnet /usr/share/dotnet

# Put the dotnet executable in the path
ENV PATH /usr/share/dotnet:$PATH
ENV DOTNET_CLI_TELEMETRY_OPTOUT=true
