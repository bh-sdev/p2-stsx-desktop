import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

class ServiceLocalization {
  provider;

  constructor() {
    this.languages = ['en', 'es'];
    this.provider = i18n;

    this.init();
  }

  get defaultConfig() {
    return {
      fallbackLng: 'en',
      whitelist: this.languages,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
      backend: {
        loadPath: '/locales/{{lng}}.json',
      },
    };
  }

  init() {
    this.provider.use(LanguageDetector).use(initReactI18next).use(Backend).init(this.defaultConfig);
  }
}

export default ServiceLocalization;
