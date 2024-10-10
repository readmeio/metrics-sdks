require 'readme/webhook'

class MetricsController < ApplicationController
  def index
    render json: { message: 'hello world' }
  end

  def post
    head :ok
  end

  def webhook
    # Your ReadMe secret
    secret = 'my-readme-secret'
    # Verify the request is legitimate and came from ReadMe
    signature = request.headers['readme-signature']

    begin
      Readme::Webhook.verify(request.raw_post, signature, secret)
    rescue Readme::MissingSignatureError, Readme::ExpiredSignatureError, Readme::InvalidSignatureError => e
      # Handle invalid requests
      render json: { error: e.message }, status: 401
      return
    end

    # Fetch the user from the database and return their data for use with OpenAPI variables.
    # current_user ||= User.find(session[:user_id]) if session[:user_id]
    render json: {
      # OAS Security variables
      keys: [
        {
          petstore_auth: 'default-key',
        },
        {
          name: 'basic_auth',
          user: 'user',
          pass: 'pass',
        },
      ]
    }
  end
end
