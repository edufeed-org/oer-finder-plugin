import { LitElement } from 'lit';
import type { components } from '@oer-aggregator/api-client';
import { type SupportedLanguage } from '../translations.js';
type OerItem = components['schemas']['OerItemSchema'];
export interface SearchParams {
    page?: number;
    pageSize?: number;
    type?: string;
    description?: string;
    name?: string;
    keywords?: string;
    license?: string;
    free_for_use?: boolean;
    educational_level?: string;
    language?: string;
    date_created_from?: string;
    date_created_to?: string;
    date_published_from?: string;
    date_published_to?: string;
    date_modified_from?: string;
    date_modified_to?: string;
}
export interface OerSearchResultEvent {
    data: OerItem[];
    meta: components['schemas']['OerMetadataSchema'];
}
export declare class OerSearchElement extends LitElement {
    static styles: import("lit").CSSResult;
    apiUrl: string;
    language: SupportedLanguage;
    lockedType?: string;
    showTypeFilter: boolean;
    pageSize: number;
    private get t();
    private client;
    private searchParams;
    private loading;
    private error;
    private advancedFiltersExpanded;
    connectedCallback(): void;
    private performSearch;
    private handleSubmit;
    private handleClear;
    private handleInputChange;
    private handleBooleanChange;
    private toggleAdvancedFilters;
    handlePageChange(newPage: number): void;
    render(): import("lit").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'oer-search': OerSearchElement;
    }
}
export {};
