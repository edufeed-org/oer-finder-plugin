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
export declare function getTranslations(language: SupportedLanguage): Translations;
export declare function getCardTranslations(language: SupportedLanguage): OerCardTranslations;
export declare function getListTranslations(language: SupportedLanguage): OerListTranslations;
export declare function getSearchTranslations(language: SupportedLanguage): OerSearchTranslations;
export declare function getPaginationTranslations(language: SupportedLanguage): PaginationTranslations;
