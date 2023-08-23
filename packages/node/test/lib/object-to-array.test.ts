import { URLSearchParams } from 'url';

import { describe, it, expect } from 'vitest';

import { objectToArray, searchToArray } from '../../src/lib/object-to-array';

describe('#object-to-array', function () {
  it('should transform a nested object of query parameters into an array', function () {
    // ?arr=1&arr2[]=&arr2[]=3&arr3[test][]=4
    const query = { arr: '1', arr2: ['', '3'], arr3: { test: ['4'] } };
    expect(objectToArray(query)).toStrictEqual([
      { name: 'arr', value: '1' },
      {
        name: 'arr2',
        value: '',
      },
      {
        name: 'arr2',
        value: '3',
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

describe('#search-to-array', function () {
  it('should transform a nested object of query parameters into an array', function () {
    const query = new URLSearchParams('arr=1&arr2=&arr2=3&arr3[test]=4');
    expect(searchToArray(query)).toStrictEqual([
      { name: 'arr', value: '1' },
      {
        name: 'arr2',
        value: '',
      },
      {
        name: 'arr2',
        value: '3',
      },
      {
        name: 'arr3[test]',
        value: '4',
      },
    ]);
  });
});
