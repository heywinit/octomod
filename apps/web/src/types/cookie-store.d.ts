/**
 * Type definitions for the Cookie Store API
 * Based on: https://developer.mozilla.org/en-US/docs/Web/API/Cookie_Store_API
 */

interface CookieStoreSetOptions {
  name: string;
  value: string;
  expires?: Date;
  domain?: string;
  path?: string;
  sameSite?: "strict" | "lax" | "none";
  secure?: boolean;
}

interface CookieStoreDeleteOptions {
  name: string;
  domain?: string;
  path?: string;
}

interface CookieListItem {
  name: string;
  value: string;
  domain?: string | null;
  path?: string;
  expires?: Date | null;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

interface CookieStore {
  get(name: string): Promise<CookieListItem | null>;
  getAll(name?: string): Promise<CookieListItem[]>;
  set(name: string | CookieStoreSetOptions, value?: string): Promise<void>;
  delete(name: string | CookieStoreDeleteOptions): Promise<void>;
}

interface Window {
  cookieStore?: CookieStore;
}
