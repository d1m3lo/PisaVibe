import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fixImageUrl = (url?: string): string => {
  if (!url) return "";
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  if (!url.startsWith('http')) {
    // This is a rough guard against relative paths or malformed URLs that are not protocol-relative.
    // It assumes that if there's no protocol, it should be https.
    // This might need adjustment if you have legitimate relative URLs.
    return `https://${url}`;
  }
  return url;
};
