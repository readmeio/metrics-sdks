require 'aws-sdk-apigateway'
require 'json'
require 'readme/webhook'

# Your ReadMe secret; you may want to store this in AWS Secrets Manager
README_SECRET = "my-readme-secret"

def handler(event:, context:)
    status_code = nil
    api_key = nil
    error = nil

    begin
        # Verify the request is legitimate and came from ReadMe.
        signature = event['headers']['ReadMe-Signature'];
        Readme::Webhook.verify(event['body'], signature, README_SECRET)

        # Look up the API key associated with the user's email address.
        body = JSON.parse(event['body']);
        email = body['email']
        client = Aws::APIGateway::Client.new()
        keys = client.get_api_keys({
            name_query: email,
            include_values: true
        })
        if keys.items.length > 0
            # If multiple API keys are returned for the given email, use the first one.
            api_key = keys.items[0].value
            status_code = 200
        else
            error = "Email not found"
            status_code = 404
        end
    rescue Readme::MissingSignatureError, Readme::ExpiredSignatureError, Readme::InvalidSignatureError => e
        error = e.message
        status_code = 401
    rescue => e
        error = e.message
        status_code = 500
    end

    if status_code == 200
        body = {
            # The user's API key
            apiKey: api_key
        }
    else
        body = {message: error}
    end

    return {
        statusCode: status_code,
        headers: {'Content-Type': 'application/json'},
        body: body.to_json
    }
end