import CodeBuilder from '../../helpers/code-builder';

export default function express(params, options) {
  const opts = {
    indent: '  ',
    ...options,
  };

  const code = new CodeBuilder(opts.indent);

  code.push('// Save this code as “server.js”');
  code.push('// Run the server with “node server.js”');
  code.push("const readme = require('readmeio');");
  code.push("const express = require('express');");

  code.blank();

  code.push('const app = express();');
  code.blank();

  code.push("app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {");
  code.push(1, '// Verify the request is legitimate and came from ReadMe');
  code.push(1, "const signature = req.headers['readme-signature'];");
  code.push(1, '// Your ReadMe secret');
  code.push(1, "const secret = 'rdme_xxxx';");
  code.push(1, 'try {');
  code.push(2, 'readme.verify(req.body, signature, secret);');
  code.push(1, '} catch (e) {');
  code.push(2, '// Handle invalid requests');
  code.push(2, 'return res.sendStatus(401);');
  code.push(1, '}');

  code.push(1, '// Fetch the user from the db');
  code.push(1, 'db.find({ email: req.body.email }).then(user => {');
  code.push(2, 'return res.json({});');
  code.push(1, '});');
  code.push('});');

  return code.join();
}
