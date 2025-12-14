import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Cookie utility functions to safely manage cookies using the Cookie Store API
 * Falls back to document.cookie if Cookie Store API is not available
 */

interface CookieOptions {
  expires?: Date | number; // Date object or max-age in seconds
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

/**
 * Checks if Cookie Store API is available
 */
function isCookieStoreAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    "cookieStore" in window &&
    window.cookieStore !== undefined
  );
}

/**
 * Sets a cookie with the given name, value, and options
 */
export async function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): Promise<void> {
  if (isCookieStoreAvailable() && window.cookieStore) {
    try {
      const cookieOptions: {
        name: string;
        value: string;
        expires?: Date;
        path?: string;
        domain?: string;
        secure?: boolean;
        sameSite?: "strict" | "lax" | "none";
      } = {
        name,
        value,
      };

      if (options.expires) {
        if (options.expires instanceof Date) {
          cookieOptions.expires = options.expires;
        } else {
          // Convert max-age to expiration date
          cookieOptions.expires = new Date(Date.now() + options.expires * 1000);
        }
      }

      if (options.path) {
        cookieOptions.path = options.path;
      }

      if (options.domain) {
        cookieOptions.domain = options.domain;
      }

      if (options.secure !== undefined) {
        cookieOptions.secure = options.secure;
      }

      if (options.sameSite) {
        cookieOptions.sameSite = options.sameSite;
      }

      await window.cookieStore.set(cookieOptions);
      return;
    } catch (error) {
      // Fall through to fallback if Cookie Store API fails
      console.warn(
        "Cookie Store API failed, falling back to document.cookie",
        error,
      );
    }
  }

  // Fallback to document.cookie
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.expires) {
    if (options.expires instanceof Date) {
      cookieString += `; expires=${options.expires.toUTCString()}`;
    } else {
      cookieString += `; max-age=${options.expires}`;
    }
  }

  if (options.path) {
    cookieString += `; path=${options.path}`;
  }

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options.secure) {
    cookieString += "; secure";
  }

  if (options.sameSite) {
    cookieString += `; sameSite=${options.sameSite}`;
  }

  // biome-ignore lint/suspicious/noDocumentCookie: Fallback when Cookie Store API is unavailable
  document.cookie = cookieString;
}

/**
 * Deletes a cookie
 */
export async function deleteCookie(
  name: string,
  options: { path?: string; domain?: string } = {},
): Promise<void> {
  if (isCookieStoreAvailable() && window.cookieStore) {
    try {
      await window.cookieStore.delete({
        name,
        path: options.path,
        domain: options.domain,
      });
      return;
    } catch (error) {
      // Fall through to fallback if Cookie Store API fails
      console.warn(
        "Cookie Store API failed, falling back to document.cookie",
        error,
      );
    }
  }

  // Fallback to document.cookie
  const expires = new Date(0).toUTCString();
  let cookieString = `${encodeURIComponent(name)}=; expires=${expires}`;

  if (options.path) {
    cookieString += `; path=${options.path}`;
  }

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  // biome-ignore lint/suspicious/noDocumentCookie: Fallback when Cookie Store API is unavailable
  document.cookie = cookieString;
}

/**
 * Gets a cookie value by name
 */
export async function getCookie(name: string): Promise<string | null> {
  if (isCookieStoreAvailable() && window.cookieStore) {
    try {
      const cookie = await window.cookieStore.get(name);
      return cookie?.value ?? null;
    } catch (error) {
      // Fall through to fallback if Cookie Store API fails
      console.warn(
        "Cookie Store API failed, falling back to document.cookie",
        error,
      );
    }
  }

  // Fallback to document.cookie
  const nameEQ = `${encodeURIComponent(name)}=`;
  // eslint-disable-next-line biomelint/suspicious/noDocumentCookie
  const cookies = document.cookie.split("; ");

  for (const cookie of cookies) {
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}
