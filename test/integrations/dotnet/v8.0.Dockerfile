FROM mcr.microsoft.com/dotnet/sdk:8.0

ADD packages/dotnet /src

WORKDIR /src/examples/net6.0
RUN dotnet publish -o out -f net8.0

ENV DOTNET_CLI_TELEMETRY_OPTOUT=true

CMD ["dotnet", "out/net6.0.dll"]
