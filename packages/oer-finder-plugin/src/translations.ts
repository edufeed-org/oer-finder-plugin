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

export interface LoadMoreTranslations {
  loadMoreButtonText: string;
  loadingText: string;
  showingText: string;
  ofText: string;
  resourcesText: string;
  allLoadedText: string;
}

export interface OerSearchTranslations {
  headerTitle: string;
  keywordsLabel: string;
  languageLabel: string;
  licenseLabel: string;
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
  advancedFiltersShowText: string;
  advancedFiltersHideText: string;
  errorMessage: string;
  allSourcesLabel: string;
}

export interface Translations {
  card: OerCardTranslations;
  list: OerListTranslations;
  search: OerSearchTranslations;
  loadMore: LoadMoreTranslations;
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
    loadMore: {
      loadMoreButtonText: 'Load More',
      loadingText: 'Loading...',
      showingText: 'Showing',
      ofText: 'of',
      resourcesText: 'resources',
      allLoadedText: 'All resources loaded',
    },
    search: {
      headerTitle: 'Search OER',
      keywordsLabel: 'Keyword search',
      languageLabel: 'Language',
      licenseLabel: 'License',
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
      advancedFiltersShowText: 'Show advanced filters',
      advancedFiltersHideText: 'Hide advanced filters',
      errorMessage: 'An error occurred',
      allSourcesLabel: 'All Sources',
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
    loadMore: {
      loadMoreButtonText: 'Mehr laden',
      loadingText: 'Laden...',
      showingText: 'Angezeigt',
      ofText: 'von',
      resourcesText: 'Ressourcen',
      allLoadedText: 'Alle Ressourcen geladen',
    },
    search: {
      headerTitle: 'OER suchen',
      keywordsLabel: 'Stichwortsuche',
      languageLabel: 'Sprache',
      licenseLabel: 'Lizenz',
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
      advancedFiltersShowText: 'Erweiterte Filter anzeigen',
      advancedFiltersHideText: 'Erweiterte Filter ausblenden',
      errorMessage: 'Ein Fehler ist aufgetreten',
      allSourcesLabel: 'Alle Quellen',
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

export function getLoadMoreTranslations(language: SupportedLanguage): LoadMoreTranslations {
  return getTranslations(language).loadMore;
}
