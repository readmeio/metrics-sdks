FROM ruby:3.1.2

WORKDIR /usr/src/app

COPY packages/ruby .
RUN bundle install

# Install example dependencies
WORKDIR /usr/src/app/examples/metrics-rails
RUN bundle install

CMD ["bin/rails", "server", "-b", "0.0.0.0", "-p", "8000"]
