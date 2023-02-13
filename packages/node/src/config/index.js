module.exports = {
  bufferLength: 1,
  timeout: 2000,
  host: process.env.README_METRICS_SERVER ? process.env.README_METRICS_SERVER : 'https://metrics.readme.io',
  readmeApiUrl: 'https://dash.readme.com/api',
};
