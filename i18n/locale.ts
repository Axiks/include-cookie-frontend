'use server';

import { cookies } from 'next/headers';
import { type Locale } from './routing';

const LOCALE_COOKIE = 'NEXT_LOCALE';

export async function setUserLocale(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
}
