const fetch = require('node-fetch');
const { URL } = require('url');

const { Headers, Request, Response } = fetch;

module.exports = () => {
  const listeners = {};

  function addEventListener(name, fn) {
    if (!listeners[name]) listeners[name] = [];
    listeners[name].push(fn);
  }

  return {
    addEventListener,
    listeners,
    fetch,
    Headers,
    Request,
    Response,
    URL,
    btoa: str => Buffer.from(str).toString('base64'),
  };
};
