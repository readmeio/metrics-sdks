# ReadMe Webhooks .NET 6.0 Demo

## Install

```sh
brew install dotnet
```

## Run

```sh
README_API_KEY=<Your ReadMe API Key here> dotnet run
```

## Test
<!-- TODO add documentation here about how to create a valid HMAC in the shell -->

```sh
curl http://localhost:4000/webhook -d '{"email": "test@example.com"}'
```
