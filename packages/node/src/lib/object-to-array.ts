import type { URLSearchParams } from 'url';

export function objectToArray(
  object: Record<string, unknown>,
  castToString?: boolean
): { name: string; value: string }[] {
  return Object.entries(object).reduce((prev, [name, value]) => {
    if (Array.isArray(value)) {
      value.forEach(val => {
        prev.push({ name, value: castToString ? String(val) : val });
      });
    } else {
      prev.push({ name, value: castToString ? String(value) : value });
    }

    return prev;
  }, []);
}

export function searchToArray(search: URLSearchParams): { name: string; value: string }[] {
  const final = [];

  search.forEach((value, name) => {
    final.push({ name, value });
  });

  return final;
}
