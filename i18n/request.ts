import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // Get locale from cookie, fallback to English
  const cookieStore = await cookies();
  let locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';

  // Ensure valid locale
  if (!['en', 'am'].includes(locale)) {
    locale = 'en';
  }

  // Import messages based on locale
  let messages;
  try {
    if (locale === 'am') {
      messages = (await import('../messages/am.json')).default;
    } else {
      messages = (await import('../messages/en.json')).default;
    }
  } catch (error) {
    console.error('Failed to load messages for locale:', locale, error);
    // Fallback to English messages
    messages = (await import('../messages/en.json')).default;
  }

  return {
    locale,
    messages
  };
});

