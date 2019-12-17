# readmeio

Track your API metrics within ReadMe.

[![Build](https://github.com/readmeio/readme-node/workflows/Node%20CI/badge.svg)](https://github.com/readmeio/readme-node)

[![](https://d3vv6lp55qjaqc.cloudfront.net/items/1M3C3j0I0s0j3T362344/Untitled-2.png)](https://readme.io)

## Installation

```
npm install readmeio
```

## Usage

Just add the middleware to express, and that's it!

```javascript
const readme = require('readmeio');

app.use(readme.metrics('<<apiKey>>', req => ({
  id: req.project._id,
  label: req.project.name,
  email: req.project.owner
})));
```

View full documentation here: [https://docs.readme.com/docs/sending-logs-to-readme-with-nodejs](https://docs.readme.com/docs/sending-logs-to-readme-with-nodejs)


### Limitations
- Currently only supports JSON. Adding a whitelist/blacklist for non-JSON bodies will not work (unless they're added to `req.body`)
the same way that `body-parser` does it. The properties will be converted to JSON in the HAR format.
- Needs more support for getting URLs when behind a reverse proxy: `x-forwarded-for`, `x-forwarded-proto`, etc.
- Needs more support for getting client IP address when behind a reverse proxy.
- Logs are "fire and forget" to the metrics server, so any failed requests (even for incorrect API key!) will currently fail silently.

## Credits
[Dom Harrington](https://github.com/domharrington/)
[Marc Cuva](https://github.com/mjcuva/)

## License

ISC
