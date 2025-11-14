/**
 * Translation system for OER Finder Plugin
 * Supports English (default) and German
 */

export type SupportedLanguage = 'en' | 'de';

export interface OerCardTranslations {
  noDataMessage: string;
  untitledMessage: string;
  licenseLabel: string;
  noLicenseMessage: string;
}

export interface OerListTranslations {
  loadingMessage: string;
  emptyTitle: string;
  emptyMessage: string;
}

export interface OerSearchTranslations {
  headerTitle: string;
  keywordsLabel: string;
  nameLabel: string;
  languageLabel: string;
  licenseLabel: string;
  freeForUseLabel: string;
  descriptionLabel: string;
  keywordsPlaceholder: string;
  namePlaceholder: string;
  languagePlaceholder: string;
  licensePlaceholder: string;
  descriptionPlaceholder: string;
  searchingText: string;
  searchButtonText: string;
  clearButtonText: string;
  anyOptionText: string;
  yesOptionText: string;
  noOptionText: string;
  firstButtonText: string;
  previousButtonText: string;
  nextButtonText: string;
  lastButtonText: string;
}

export interface Translations {
  card: OerCardTranslations;
  list: OerListTranslations;
  search: OerSearchTranslations;
}

const translations: Record<SupportedLanguage, Translations> = {
  en: {
    card: {
      noDataMessage: 'No OER data available',
      untitledMessage: 'Untitled Resource',
      licenseLabel: 'License:',
      noLicenseMessage: 'No license information',
    },
    list: {
      loadingMessage: 'Loading resources...',
      emptyTitle: 'No resources found',
      emptyMessage: 'Try adjusting your search criteria or check back later.',
    },
    search: {
      headerTitle: 'Search Open Educational Resources',
      keywordsLabel: 'Keywords',
      nameLabel: 'Name',
      languageLabel: 'Language',
      licenseLabel: 'License',
      freeForUseLabel: 'Free for use',
      descriptionLabel: 'Description',
      keywordsPlaceholder: 'Enter keywords...',
      namePlaceholder: 'Resource name...',
      languagePlaceholder: 'e.g., en, de, fr',
      licensePlaceholder: 'License URI...',
      descriptionPlaceholder: 'Search in descriptions...',
      searchingText: 'Searching...',
      searchButtonText: 'Search',
      clearButtonText: 'Clear',
      anyOptionText: 'Any',
      yesOptionText: 'Yes',
      noOptionText: 'No',
      firstButtonText: 'First',
      previousButtonText: 'Previous',
      nextButtonText: 'Next',
      lastButtonText: 'Last',
    },
  },
  de: {
    card: {
      noDataMessage: 'Keine OER-Daten verfügbar',
      untitledMessage: 'Unbenannte Ressource',
      licenseLabel: 'Lizenz:',
      noLicenseMessage: 'Keine Lizenzinformationen',
    },
    list: {
      loadingMessage: 'Ressourcen werden geladen...',
      emptyTitle: 'Keine Ressourcen gefunden',
      emptyMessage:
        'Passen Sie Ihre Suchkriterien an oder versuchen Sie es später erneut.',
    },
    search: {
      headerTitle: 'Open Educational Resources suchen',
      keywordsLabel: 'Schlüsselwörter',
      nameLabel: 'Name',
      languageLabel: 'Sprache',
      licenseLabel: 'Lizenz',
      freeForUseLabel: 'Kostenlos verfügbar',
      descriptionLabel: 'Beschreibung',
      keywordsPlaceholder: 'Schlüsselwörter eingeben...',
      namePlaceholder: 'Ressourcenname...',
      languagePlaceholder: 'z.B. de, en, fr',
      licensePlaceholder: 'Lizenz-URI...',
      descriptionPlaceholder: 'In Beschreibungen suchen...',
      searchingText: 'Suche läuft...',
      searchButtonText: 'Suchen',
      clearButtonText: 'Zurücksetzen',
      anyOptionText: 'Alle',
      yesOptionText: 'Ja',
      noOptionText: 'Nein',
      firstButtonText: 'Erste',
      previousButtonText: 'Zurück',
      nextButtonText: 'Weiter',
      lastButtonText: 'Letzte',
    },
  },
};

export function getTranslations(language: SupportedLanguage): Translations {
  return translations[language] || translations.en;
}

export function getCardTranslations(
  language: SupportedLanguage
): OerCardTranslations {
  return getTranslations(language).card;
}

export function getListTranslations(
  language: SupportedLanguage
): OerListTranslations {
  return getTranslations(language).list;
}

export function getSearchTranslations(
  language: SupportedLanguage
): OerSearchTranslations {
  return getTranslations(language).search;
}
