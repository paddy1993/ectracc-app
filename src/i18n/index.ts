/**
 * Internationalization (i18n) Configuration
 * Supports multiple languages and regions for ECTRACC
 */

// i18n temporarily disabled due to TypeScript version conflicts
// import i18n from 'i18next';
// import { initReactI18next } from 'react-i18next';
// import LanguageDetector from 'i18next-browser-languagedetector';
// import Backend from 'i18next-http-backend';

// Import translations
import enUS from './locales/en-US.json';
import esES from './locales/es-ES.json';
import frFR from './locales/fr-FR.json';
import deDE from './locales/de-DE.json';
import itIT from './locales/it-IT.json';
import ptBR from './locales/pt-BR.json';
import jaJP from './locales/ja-JP.json';
import zhCN from './locales/zh-CN.json';
import koKR from './locales/ko-KR.json';
import arSA from './locales/ar-SA.json';
import logger from '../utils/logger';

// Supported languages configuration
export const supportedLanguages = {
  'en-US': {
    name: 'English (US)',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false,
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'en-US',
    currency: 'USD',
    units: 'imperial'
  },
  'es-ES': {
    name: 'Spanish (Spain)',
    nativeName: 'Español',
    flag: '🇪🇸',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'es-ES',
    currency: 'EUR',
    units: 'metric'
  },
  'fr-FR': {
    name: 'French (France)',
    nativeName: 'Français',
    flag: '🇫🇷',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'fr-FR',
    currency: 'EUR',
    units: 'metric'
  },
  'de-DE': {
    name: 'German (Germany)',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    rtl: false,
    dateFormat: 'DD.MM.YYYY',
    numberFormat: 'de-DE',
    currency: 'EUR',
    units: 'metric'
  },
  'it-IT': {
    name: 'Italian (Italy)',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'it-IT',
    currency: 'EUR',
    units: 'metric'
  },
  'pt-BR': {
    name: 'Portuguese (Brazil)',
    nativeName: 'Português',
    flag: '🇧🇷',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'pt-BR',
    currency: 'BRL',
    units: 'metric'
  },
  'ja-JP': {
    name: 'Japanese (Japan)',
    nativeName: '日本語',
    flag: '🇯🇵',
    rtl: false,
    dateFormat: 'YYYY/MM/DD',
    numberFormat: 'ja-JP',
    currency: 'JPY',
    units: 'metric'
  },
  'zh-CN': {
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    flag: '🇨🇳',
    rtl: false,
    dateFormat: 'YYYY/MM/DD',
    numberFormat: 'zh-CN',
    currency: 'CNY',
    units: 'metric'
  },
  'ko-KR': {
    name: 'Korean (South Korea)',
    nativeName: '한국어',
    flag: '🇰🇷',
    rtl: false,
    dateFormat: 'YYYY.MM.DD',
    numberFormat: 'ko-KR',
    currency: 'KRW',
    units: 'metric'
  },
  'ar-SA': {
    name: 'Arabic (Saudi Arabia)',
    nativeName: 'العربية',
    flag: '🇸🇦',
    rtl: true,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'ar-SA',
    currency: 'SAR',
    units: 'metric'
  }
};

// Resources object for i18next
const resources = {
  'en-US': { translation: enUS },
  'es-ES': { translation: esES },
  'fr-FR': { translation: frFR },
  'de-DE': { translation: deDE },
  'it-IT': { translation: itIT },
  'pt-BR': { translation: ptBR },
  'ja-JP': { translation: jaJP },
  'zh-CN': { translation: zhCN },
  'ko-KR': { translation: koKR },
  'ar-SA': { translation: arSA }
};

// Create a simple fallback i18n object
const i18n = {
  t: (key: string, options?: any) => {
    // Simple fallback - return the key or English translation
    const keys = key.split('.');
    let value = enUS;
    for (const k of keys) {
      value = (value as any)?.[k];
      if (!value) break;
    }
    return value || key;
  },
  language: 'en-US',
  changeLanguage: (lng: string) => Promise.resolve(),
  on: (event: string, callback: Function) => {},
  off: (event: string, callback: Function) => {},
  exists: (key: string) => true
};

// Language change handler - disabled
// i18n.on('languageChanged', (lng) => {
//   const config = supportedLanguages[lng as keyof typeof supportedLanguages];
  
//   if (config) {
//     // Update document direction for RTL languages
//     document.documentElement.dir = config.rtl ? 'rtl' : 'ltr';
//     document.documentElement.lang = lng;
//     
//     // Update theme for RTL
//     if (config.rtl) {
//       document.body.classList.add('rtl');
//     } else {
//       document.body.classList.remove('rtl');
//     }
//     
//     // Store user preference
//     localStorage.setItem('ectracc-language', lng);
//     localStorage.setItem('ectracc-language-config', JSON.stringify(config));
//   }
// });

// Utility functions
export const getCurrentLanguageConfig = () => {
  const lng = i18n.language;
  return supportedLanguages[lng as keyof typeof supportedLanguages] || supportedLanguages['en-US'];
};

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => {
  const lng = i18n.language;
  return new Intl.NumberFormat(lng, options).format(value);
};

export const formatCurrency = (value: number, currency?: string) => {
  const lng = i18n.language;
  const config = getCurrentLanguageConfig();
  return new Intl.NumberFormat(lng, {
    style: 'currency',
    currency: currency || config.currency
  }).format(value);
};

export const formatDate = (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
  const lng = i18n.language;
  return new Intl.DateTimeFormat(lng, options).format(new Date(date));
};

export const formatRelativeTime = (value: number, unit: Intl.RelativeTimeFormatUnit) => {
  const lng = i18n.language;
  return new Intl.RelativeTimeFormat(lng, { numeric: 'auto' }).format(value, unit);
};

export const formatCarbonFootprint = (value: number, unit: string = 'kg CO₂e') => {
  const formattedValue = formatNumber(value, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  return `${formattedValue} ${unit}`;
};

export const getCountryList = () => {
  const lng = i18n.language;
  const displayNames = new Intl.DisplayNames([lng], { type: 'region' });
  
  // ISO 3166-1 alpha-2 country codes
  const countryCodes = [
    'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT',
    'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI',
    'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY',
    'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
    'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM',
    'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK',
    'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL',
    'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
    'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR',
    'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN',
    'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS',
    'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
    'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW',
    'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP',
    'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM',
    'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
    'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM',
    'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF',
    'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW',
    'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
    'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'
  ];
  
  return countryCodes.map(code => ({
    code,
    name: displayNames.of(code) || code
  })).sort((a, b) => a.name.localeCompare(b.name, lng));
};

export const detectUserRegion = async (): Promise<string> => {
  try {
    // Try to get user's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Map common timezones to regions
    const timezoneToRegion: Record<string, string> = {
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'Europe/London': 'GB',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Europe/Madrid': 'ES',
      'Europe/Rome': 'IT',
      'Asia/Tokyo': 'JP',
      'Asia/Shanghai': 'CN',
      'Asia/Seoul': 'KR',
      'Asia/Dubai': 'AE',
      'Australia/Sydney': 'AU',
      'America/Sao_Paulo': 'BR'
    };
    
    const region = timezoneToRegion[timezone];
    if (region) {
      return region;
    }
    
    // Fallback to browser language
    const browserLang = navigator.language;
    const langToRegion: Record<string, string> = {
      'en-US': 'US',
      'en-GB': 'GB',
      'es-ES': 'ES',
      'fr-FR': 'FR',
      'de-DE': 'DE',
      'it-IT': 'IT',
      'pt-BR': 'BR',
      'ja-JP': 'JP',
      'zh-CN': 'CN',
      'ko-KR': 'KR',
      'ar-SA': 'SA'
    };
    
    return langToRegion[browserLang] || 'US';
  } catch (error) {
    console.error('Error detecting user region:', error);
    return 'US';
  }
};

export const getUnitSystem = () => {
  const config = getCurrentLanguageConfig();
  return config.units;
};

export const convertUnits = (value: number, fromUnit: string, toUnit: string): number => {
  const conversions: Record<string, Record<string, number>> = {
    // Weight conversions
    'kg': { 'lb': 2.20462, 'oz': 35.274, 'g': 1000 },
    'lb': { 'kg': 0.453592, 'oz': 16, 'g': 453.592 },
    'oz': { 'kg': 0.0283495, 'lb': 0.0625, 'g': 28.3495 },
    'g': { 'kg': 0.001, 'lb': 0.00220462, 'oz': 0.035274 },
    
    // Volume conversions
    'l': { 'gal': 0.264172, 'qt': 1.05669, 'pt': 2.11338, 'cup': 4.22675, 'fl_oz': 33.814 },
    'ml': { 'l': 0.001, 'gal': 0.000264172, 'fl_oz': 0.033814 },
    'gal': { 'l': 3.78541, 'qt': 4, 'pt': 8, 'cup': 16, 'fl_oz': 128 },
    'qt': { 'l': 0.946353, 'gal': 0.25, 'pt': 2, 'cup': 4, 'fl_oz': 32 },
    'pt': { 'l': 0.473176, 'gal': 0.125, 'qt': 0.5, 'cup': 2, 'fl_oz': 16 },
    'cup': { 'l': 0.236588, 'gal': 0.0625, 'qt': 0.25, 'pt': 0.5, 'fl_oz': 8 },
    'fl_oz': { 'l': 0.0295735, 'ml': 29.5735, 'gal': 0.0078125, 'cup': 0.125 }
  };
  
  if (fromUnit === toUnit) return value;
  
  const conversion = conversions[fromUnit]?.[toUnit];
  if (conversion) {
    return value * conversion;
  }
  
  // If direct conversion not found, try reverse
  const reverseConversion = conversions[toUnit]?.[fromUnit];
  if (reverseConversion) {
    return value / reverseConversion;
  }
  
  logger.warn(`No conversion found from ${fromUnit} to ${toUnit}`);
  return value;
};

export default i18n;
