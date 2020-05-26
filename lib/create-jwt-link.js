const getReadmeData = require('./get-readme-data');
const { v4 } = require('uuid');
const jwt = require('jsonwebtoken');

module.exports = async (apiKey, user, redirectPath = '') => {
  const readmeData = await getReadmeData(apiKey);
  let baseUrl = redirectPath;

  if (!redirectPath.startsWith('http')) {
    baseUrl = `${readmeData.baseUrl}${redirectPath}`;
  }

  const jwtOptions = {
    jwtid: v4(),
  };

  let token = '';
  try {
    token = jwt.sign(user, readmeData.jwtSecret, jwtOptions);
  } catch (e) {
    // If something fails, just go back to readme
  }
  return `${baseUrl}?auth_token=${token}`;
};
