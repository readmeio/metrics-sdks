# ReadMe Metrics/Webhooks Express Demo

## Install

```sh
npm install
```

## Metrics

### Run

```sh
README_API_KEY=<Your ReadMe API Key here> npm run start:metrics
```

### Test
```sh
curl http://localhost:4000
```

## Webhooks

### Run
```sh
README_API_KEY=<Your ReadMe API Key here> npm run start:webhook
```

### Test
<!-- TODO add documentation here about how to create a valid HMAC in the shell -->

```sh
curl http://localhost:4000/webhook -d '{"email": "test@example.com"}'
```
