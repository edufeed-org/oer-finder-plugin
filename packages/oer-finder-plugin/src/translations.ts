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

export interface PaginationTranslations {
  firstButtonText: string;
  previousButtonText: string;
  nextButtonText: string;
  lastButtonText: string;
  showingPagesText: string;
  totalResourcesText: string;
  pageOfText: string;
  ofText: string;
}

export interface OerListTranslations {
  loadingMessage: string;
  emptyTitle: string;
  emptyMessage: string;
}

export interface OerSearchTranslations {
  headerTitle: string;
  keywordsLabel: string;
  languageLabel: string;
  licenseLabel: string;
  freeForUseLabel: string;
  sourceLabel: string;
  typeLabel: string;
  keywordsPlaceholder: string;
  languagePlaceholder: string;
  licensePlaceholder: string;
  typePlaceholder: string;
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
  showingPagesText: string;
  totalResourcesText: string;
  pageOfText: string;
  advancedFiltersShowText: string;
  advancedFiltersHideText: string;
  errorMessage: string;
}

export interface Translations {
  card: OerCardTranslations;
  list: OerListTranslations;
  search: OerSearchTranslations;
  pagination: PaginationTranslations;
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
    pagination: {
      firstButtonText: 'First',
      previousButtonText: 'Previous',
      nextButtonText: 'Next',
      lastButtonText: 'Last',
      showingPagesText: 'Showing',
      totalResourcesText: 'total resources',
      pageOfText: 'Page',
      ofText: 'of',
    },
    search: {
      headerTitle: 'Search OER',
      keywordsLabel: 'Keyword search',
      languageLabel: 'Language',
      licenseLabel: 'License',
      freeForUseLabel: 'Free for use',
      sourceLabel: 'Source',
      typeLabel: 'Resource type',
      keywordsPlaceholder: 'Search by keyword...',
      languagePlaceholder: 'e.g., en, de, fr',
      licensePlaceholder: 'License URI...',
      typePlaceholder: 'e.g., image, video, document',
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
      showingPagesText: 'Showing',
      totalResourcesText: 'total resources',
      pageOfText: 'Page',
      advancedFiltersShowText: 'Show advanced filters',
      advancedFiltersHideText: 'Hide advanced filters',
      errorMessage: 'An error occurred',
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
      emptyMessage: 'Passen Sie Ihre Suchkriterien an oder versuchen Sie es später erneut.',
    },
    pagination: {
      firstButtonText: 'Erste',
      previousButtonText: 'Zurück',
      nextButtonText: 'Weiter',
      lastButtonText: 'Letzte',
      showingPagesText: 'Angezeigt',
      totalResourcesText: 'Ressourcen insgesamt',
      pageOfText: 'Seite',
      ofText: 'von',
    },
    search: {
      headerTitle: 'OER suchen',
      keywordsLabel: 'Stichwortsuche',
      languageLabel: 'Sprache',
      licenseLabel: 'Lizenz',
      freeForUseLabel: 'Kostenlos verfügbar',
      sourceLabel: 'Quelle',
      typeLabel: 'Ressourcentyp',
      keywordsPlaceholder: 'Nach einem Stichwort suchen...',
      languagePlaceholder: 'z.B. de, en, fr',
      licensePlaceholder: 'Lizenz-URI...',
      typePlaceholder: 'z.B. image, video, document',
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
      showingPagesText: 'Angezeigt',
      totalResourcesText: 'Ressourcen insgesamt',
      pageOfText: 'Seite',
      advancedFiltersShowText: 'Erweiterte Filter anzeigen',
      advancedFiltersHideText: 'Erweiterte Filter ausblenden',
      errorMessage: 'Ein Fehler ist aufgetreten',
    },
  },
};

export function getTranslations(language: SupportedLanguage): Translations {
  return translations[language] || translations.en;
}

export function getCardTranslations(language: SupportedLanguage): OerCardTranslations {
  return getTranslations(language).card;
}

export function getListTranslations(language: SupportedLanguage): OerListTranslations {
  return getTranslations(language).list;
}

export function getSearchTranslations(language: SupportedLanguage): OerSearchTranslations {
  return getTranslations(language).search;
}

export function getPaginationTranslations(language: SupportedLanguage): PaginationTranslations {
  return getTranslations(language).pagination;
}
