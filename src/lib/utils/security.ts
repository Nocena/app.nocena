import DOMPurify from 'dompurify';
import { FilterXSS } from 'xss';

const xssFilter = new FilterXSS({
  whiteList: {},
  stripIgnoreTag: true,
  css: false,
});

export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  const cleaned = xssFilter.process(DOMPurify.sanitize(input));
  return cleaned.replace(/<\/?[^>]+(>|$)/g, '');
};

export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    if (typeof value === 'string') {
      acc[key as keyof T] = sanitizeInput(value) as any;
    } else if (Array.isArray(value)) {
      acc[key as keyof T] = value.map((item) => (typeof item === 'string' ? sanitizeInput(item) : item)) as any;
    } else {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as T);
};
