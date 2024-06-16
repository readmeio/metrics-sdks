module.exports = [
  {
    name: '"petstore" auth',
    default: 'default "key"\\',
    source: 'security',
    type: 'oauth2',
  },
  {
    name: 'basic-auth',
    default: 'default',
    source: 'security',
    type: 'http',
    scheme: 'basic',
  },
  {
    name: 'normal_security_var',
    default: 'default',
    source: 'security',
    type: 'http',
    scheme: 'basic',
  },
  {
    name: '2name',
    default: 'default-name',
    source: 'server',
  },
  {
    name: '*port',
    default: '',
    source: 'server',
  },
  {
    name: 'p*o?r*t',
    default: '',
    source: 'server',
  },
  {
    name: 'normal_server_var',
    default: '',
    source: 'server',
  },
];
