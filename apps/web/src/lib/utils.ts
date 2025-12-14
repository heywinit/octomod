import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Cookie utility functions to safely manage cookies
 */

interface CookieOptions {
	expires?: Date | number; // Date object or max-age in seconds
	path?: string;
	domain?: string;
	secure?: boolean;
	sameSite?: "strict" | "lax" | "none";
}

/**
 * Sets a cookie with the given name, value, and options
 */
export function setCookie(
	name: string,
	value: string,
	options: CookieOptions = {},
): void {
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

	document.cookie = cookieString;
}

/**
 * Deletes a cookie by setting it to expire in the past
 */
export function deleteCookie(name: string, options: { path?: string; domain?: string } = {}): void {
	const expires = new Date(0).toUTCString();
	let cookieString = `${encodeURIComponent(name)}=; expires=${expires}`;

	if (options.path) {
		cookieString += `; path=${options.path}`;
	}

	if (options.domain) {
		cookieString += `; domain=${options.domain}`;
	}

	document.cookie = cookieString;
}

/**
 * Gets a cookie value by name
 */
export function getCookie(name: string): string | null {
	const nameEQ = `${encodeURIComponent(name)}=`;
	const cookies = document.cookie.split("; ");

	for (const cookie of cookies) {
		if (cookie.startsWith(nameEQ)) {
			return decodeURIComponent(cookie.substring(nameEQ.length));
		}
	}

	return null;
}
