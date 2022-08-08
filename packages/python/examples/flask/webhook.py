import os
import sys
import json
import hmac
from datetime import datetime, timedelta
from flask import Flask, request

if os.getenv("README_API_KEY") is None:
    sys.stderr.write("Missing `README_API_KEY` environment variable")
    sys.stderr.flush()
    os._exit(1)

app = Flask(__name__)

@app.post("/webhook")
def webhook():
  try:
    signature = request.headers.get('readme-signature', None)

    if signature is None:
      raise Exception("Missing Signature")

    input = dict((x.strip(), y.strip())
             for x, y in (element.split('=')
             for element in signature.split(',')))

    time = input["t"];

    if datetime.now() - datetime.fromtimestamp(int(input["t"])/1000) > timedelta(minutes=30):
      raise Exception("Expired Signature")

    body = request.get_json();
    unsigned = time + "." + json.dumps(body, separators=(',', ':'))
    verify_signature = hmac.new(os.getenv("README_API_KEY").encode('utf8'), unsigned.encode('utf8'), 'sha256').hexdigest()
    readme_signature = input['v0'];
    if hmac.compare_digest(verify_signature.encode(), readme_signature.encode('utf8')) is False:
      raise Exception("Invalid Signature")

  except Exception as e:
    return (
        {"error": str(e)},
        401,
        {"Content-Type": "application/json; charset=utf-8"},
    )

  return (
      {"petstore_auth": "default-key", "basic_auth": { "user": "user", "pass": "pass"}},
      200,
      {"Content-Type": "application/json; charset=utf-8"},
  )

if __name__ == "__main__":
    app.run(debug=False, host="127.0.0.1", port=os.getenv("PORT", 4000))
