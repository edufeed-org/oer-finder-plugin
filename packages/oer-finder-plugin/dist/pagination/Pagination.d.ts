import { LitElement } from 'lit';
import type { components } from '@edufeed-org/oer-finder-api-client';
import { type SupportedLanguage } from '../translations.js';
export interface OerPageChangeEvent {
    page: number;
}
export declare class PaginationElement extends LitElement {
    static styles: import("lit").CSSResult;
    metadata: components['schemas']['OerMetadataSchema'] | null;
    loading: boolean;
    language: SupportedLanguage;
    private get t();
    render(): import("lit").TemplateResult<1> | "";
    private handlePageChange;
}
declare global {
    interface HTMLElementTagNameMap {
        'oer-pagination': PaginationElement;
    }
}
