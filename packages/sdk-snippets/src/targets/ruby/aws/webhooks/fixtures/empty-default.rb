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
        signature = event['headers']['ReadMe-Signature'];
        Readme::Webhook.verify(event['body'], signature, README_SECRET)

        body = JSON.parse(event['body']);
        email = body['email']
        client = Aws::APIGateway::Client.new()
        keys = client.get_api_keys({
            name_query: email,
            include_values: true
        })
        if keys.items.length > 0
            # if multiple API keys are returned for the given email, use the first one
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
            # OAS Server variables
            name: "",

            # OAS Security variables
            petstore_auth: api_key,
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