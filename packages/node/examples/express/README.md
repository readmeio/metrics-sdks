# ReadMe Metrics/Webhooks Express Demo

```sh
npm install
```

## 📊 Metrics

```sh
make serve-metrics-express
```

Access your test server to demo Metrics by making a cURL request:

```sh
curl http://localhost:8000
```

## 📞 Webhooks

```sh
make serve-webhooks-express
```

We have to generate a valid HMAC to send through to the webhook, you can do that with the following shell commands:

```sh
README_API_KEY=<Your ReadMe API Key here>
TIME=$(date +%s000)
UNSIGNED=$TIME.{\"email\":\"test@example.com\"}
HMAC=$(echo -n $UNSIGNED | openssl dgst -sha256 -hmac $README_API_KEY -hex)
SIGNATURE="t=$TIME,v0=$HMAC"

curl http://localhost:8000/webhook \
  -H "readme-signature: $SIGNATURE" \
  -H "content-type: application/json" \
  -d '{"email":"test@example.com"}'
```

You should see the user's API keys returned in the terminal!
