import { LitElement } from 'lit';
import type { components } from '../../../oer-finder-api-client/dist/index.js';
import '../oer-card/OerCard.js';
import '../pagination/Pagination.js';
import { type SupportedLanguage } from '../translations.js';
type OerItem = components['schemas']['OerItemSchema'];
export declare class OerListElement extends LitElement {
    static styles: import("lit").CSSResult;
    oers: OerItem[];
    loading: boolean;
    error: string | null;
    onCardClick: ((oer: OerItem) => void) | null;
    language: SupportedLanguage;
    showPagination: boolean;
    metadata: components['schemas']['OerMetadataSchema'] | null;
    onPageChange: ((page: number) => void) | null;
    private get t();
    render(): import("lit").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'oer-list': OerListElement;
    }
}
export {};
