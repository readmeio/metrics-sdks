import path from 'path';

import { expect } from 'chai';

describe('config', function () {
  it('should have all config files in dist', function () {
    const file = path.join(__dirname, '/../dist/src/config/localhost.json');

    expect(() => {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      require(file);
    }).not.to.throw();
  });
});
