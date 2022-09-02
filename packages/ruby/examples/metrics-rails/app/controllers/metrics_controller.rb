require 'readme/webhook'

class MetricsController < ApplicationController
  def index
    render json: { 'message' => 'hello world' }
  end

  def post
    head :ok
  end

  def webhook
    signature = request.headers['readme-signature']

    begin
      Readme::Webhook.verify(request.raw_post, signature, ENV.fetch('README_API_KEY', nil))
    rescue RuntimeError => e
      render json: { error: e.message }, status: 401
      return
    end

    render json: {
      petstore_auth: 'default-key',
      basic_auth: { user: 'user', pass: 'pass' }
    }
  end
end
