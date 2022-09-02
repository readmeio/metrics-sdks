class MetricsController < ApplicationController
  def index
    render json: { 'message' => 'hello world' }
  end

  def post
    head :ok
  end

  def webhook
    render json: {
      petstore_auth: 'default-key',
      basic_auth: { user: 'user', pass: 'pass' }
    }
  end
end
