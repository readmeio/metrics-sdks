FROM mcr.microsoft.com/dotnet/sdk:6.0

ADD packages/dotnet /src

WORKDIR /src/examples/net6.0-webhook
RUN dotnet publish -o out

ENV DOTNET_CLI_TELEMETRY_OPTOUT=true

CMD ["dotnet", "out/net6.0-webhook.dll"]
