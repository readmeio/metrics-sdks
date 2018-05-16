module.exports = object =>
  Object.entries(object).reduce((prev, [name, value]) => {
    prev.push({ name, value });
    return prev;
  }, []);
