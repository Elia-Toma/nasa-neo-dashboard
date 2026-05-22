import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationIT from '../locales/it/translation.json';
import translationEN from '../locales/en/translation.json';

// the translations
const resources = {
    it: {
        translation: translationIT,
    },
    en: {
        translation: translationEN,
    }
};

const systemLang = navigator.language.split('-')[0];
const defaultLang = resources[systemLang as keyof typeof resources] ? systemLang : 'en';

i18n
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
        resources,
        lng: defaultLang,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
        react: {
            //wait: true,
            useSuspense: true
        },
    });

export default i18n;
