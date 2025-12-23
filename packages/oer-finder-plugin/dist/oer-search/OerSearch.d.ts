import { LitElement } from 'lit';
import type { components } from '@edufeed-org/oer-finder-api-client';
import { type SupportedLanguage } from '../translations.js';
type OerItem = components['schemas']['OerItemSchema'];
export interface SearchParams {
    page?: number;
    pageSize?: number;
    source?: string;
    type?: string;
    searchTerm?: string;
    license?: string;
    free_for_use?: boolean;
    educational_level?: string;
    language?: string;
}
export interface SourceOption {
    value: string;
    label: string;
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
    availableSources: SourceOption[];
    lockedSource?: string;
    showSourceFilter: boolean;
    private get t();
    private client;
    private searchParams;
    private loading;
    private error;
    private advancedFiltersExpanded;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private handleSlottedPageChange;
    updated(changedProperties: Map<string, unknown>): void;
    private performSearch;
    private handleSubmit;
    private handleClear;
    private handleInputChange;
    private handleBooleanChange;
    private toggleAdvancedFilters;
    render(): import("lit").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'oer-search': OerSearchElement;
    }
}
export {};
