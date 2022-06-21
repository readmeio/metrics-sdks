import { access, constants } from 'fs';
import { promisify } from 'util';
import path from 'path';

test('should have all config files in dist', () => {
  const file = path.join(__dirname, '/../dist/src/config/localhost.json');
  return expect(promisify(access)(file, constants.F_OK)).resolves.not.toThrow();
});
