import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationIT from '../locales/it/translation.json';
import translationEN from '../locales/en/translation.json';

// Translation dictionary resources
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
    .use(initReactI18next) // Bind react-i18next integration
    .init({
        resources,
        lng: defaultLang,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React performs native XSS escaping
        },
        react: {
            //wait: true,
            useSuspense: true
        },
    });

export default i18n;
