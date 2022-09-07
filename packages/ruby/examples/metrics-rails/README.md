# ReadMe Metrics/Webhooks Rails Demo

```sh
make install
```

## 📊 Metrics

```sh
make serve-metrics-rails
```

Access your test server to demo Metrics by making a cURL request:

```sh
curl http://localhost:8000
```

## 📞 Webhooks

```sh
make serve-metrics-rails
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
