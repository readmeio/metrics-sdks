module.exports = (apiKey, group) => {
  if (!apiKey) throw new Error('You must provide your ReadMe API key');
  if (!group) throw new Error('You must provide a grouping function');

  return (req, res, next) => {
    return next();
  };
};
