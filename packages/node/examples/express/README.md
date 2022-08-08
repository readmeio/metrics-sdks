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

We have to generate a valid HMAC to send through to the webhook, you can do that with the following shell commands:

```sh
README_API_KEY=<Your ReadMe API Key here>
TIME=$(date +%s000)
UNSIGNED=$TIME.{\"email\":\"test@example.com\"}
HMAC=$(echo -n $UNSIGNED | openssl dgst -sha256 -hmac $README_API_KEY -hex)
SIGNATURE="t=$TIME,v0=$HMAC"

curl http://localhost:4000/webhook \
  -H "readme-signature: $SIGNATURE" \
  -H "content-type: application/json" \
  -d '{"email":"test@example.com"}'
```

You should see the user's API keys returned in the terminal!
