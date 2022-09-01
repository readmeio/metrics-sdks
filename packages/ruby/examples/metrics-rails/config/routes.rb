Rails.application.routes.draw do
  get '/', to: 'metrics#index'
  post '/', to: 'metrics#post'
  post '/webhook', to: 'metrics#webhook'
end
