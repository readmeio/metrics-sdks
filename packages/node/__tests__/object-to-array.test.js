const objectToArray = require('../lib/object-to-array');

describe('#object-to-array', () => {
  it('should transform a nested object of query parameters into an array', () => {
    // ?arr=1&arr2[]=&arr2[]=3&arr3[test][]=4
    const query = { arr: '1', arr2: ['', '3'], arr3: { test: ['4'] } };
    expect(objectToArray(query)).toStrictEqual([
      { name: 'arr', value: '1' },
      {
        name: 'arr2',
        value: ['', '3'],
      },
      {
        name: 'arr3',
        value: {
          test: ['4'],
        },
      },
    ]);
  });
});
