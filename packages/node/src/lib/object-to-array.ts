import type { URLSearchParams } from 'url';

export function objectToArray(
  object: Record<string, unknown>,
  opts: { castToString: true }
): { name: string; value: string }[];
export function objectToArray(object: Record<string, unknown>): { name: string; value: unknown }[];
export function objectToArray(
  object: Record<string, unknown>,
  opts: {
    castToString: boolean;
  } = {
    castToString: false,
  }
): { name: string; value: unknown }[] {
  return Object.entries(object).reduce<{ name: string; value: unknown }[]>((prev, [name, value]) => {
    if (Array.isArray(value)) {
      value.forEach(val => {
        prev.push({ name, value: opts.castToString ? String(val) : val });
      });
    } else {
      prev.push({ name, value: opts.castToString ? String(value) : value });
    }

    return prev;
  }, []);
}

export function searchToArray(search: URLSearchParams): { name: string; value: string }[] {
  const final: { name: string; value: string }[] = [];

  search.forEach((value, name) => {
    final.push({ name, value });
  });

  return final;
}
