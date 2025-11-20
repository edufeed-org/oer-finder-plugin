import { LitElement } from 'lit';
import type { components } from '@oer-aggregator/api-client';
import { type SupportedLanguage } from '../translations.js';
export declare class PaginationElement extends LitElement {
    static styles: import("lit").CSSResult;
    metadata: components['schemas']['OerMetadataSchema'] | null;
    loading: boolean;
    onPageChange: ((page: number) => void) | null;
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
