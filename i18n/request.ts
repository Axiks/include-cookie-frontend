import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { locales, defaultLocale, type Locale } from './routing';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;

  let locale: Locale = defaultLocale;

  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    locale = cookieLocale as Locale;
  } else {
    const headersList = await headers();
    const acceptLang = headersList.get('accept-language') ?? '';
    const primary = acceptLang.split(',')[0].split(';')[0].trim().split('-')[0];
    if (locales.includes(primary as Locale)) {
      locale = primary as Locale;
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
