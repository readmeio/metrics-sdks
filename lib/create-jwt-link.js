const getReadmeData = require('./get-readme-data');
const uuid = require('node-uuid');
const jwt = require('jsonwebtoken');

module.exports = async (apiKey, user, redirectPath = '') => {
  if (!apiKey) throw new Error('You must provide your ReadMe API key');
  if (!user) throw new Error('You must provide a user object');

  const readmeData = await getReadmeData(apiKey);
  let baseUrl = redirectPath;

  if (!redirectPath.startsWith('http')) {
    baseUrl = `${readmeData.baseUrl}${redirectPath}`;
  }

  const jwtOptions = {
    jwtid: uuid.v4(),
  };

  let token = '';
  try {
    token = jwt.sign(user, readmeData.jwtSecret, jwtOptions);
  } catch (e) {
    // If something fails, just go back to readme
  }
  return `${baseUrl}?auth_token=${token}`;
};
