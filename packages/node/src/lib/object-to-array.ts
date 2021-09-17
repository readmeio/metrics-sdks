import { URLSearchParams } from 'url';

export function objectToArray(object: Record<string, unknown>): Array<{ name: string; value: string }> {
  return Object.entries(object).reduce((prev, [name, value]) => {
    if (Array.isArray(value)) {
      value.forEach(val => {
        prev.push({ name, value: val });
      });
    } else {
      prev.push({ name, value });
    }

    return prev;
  }, []);
}

export function searchToArray(search: URLSearchParams): Array<{ name: string; value: string }> {
  const final = [];

  search.forEach((name, value) => {
    final.push({ name, value });
  });

  return final;
}
