import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'hello world' });
});

const server = app.listen(process.env.PORT, 'localhost', function () {
  const { address, port } = server.address();
  // eslint-disable-next-line no-console
  console.log('Example app listening at http://%s:%s', address, port);
});
