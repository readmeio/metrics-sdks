const path = require('path');
const fs = require('fs');

const template = fs.readFileSync(path.join(__dirname, './dist/main.js'), 'utf8');

module.exports = function compile(apiKey) {
  if (!apiKey) throw new Error('Must provide an apiKey');

  return template.replace('API_KEY', apiKey);
};
