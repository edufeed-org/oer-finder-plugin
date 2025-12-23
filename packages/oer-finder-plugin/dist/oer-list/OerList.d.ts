import { LitElement } from 'lit';
import type { components } from '@edufeed-org/oer-finder-api-client';
import '../oer-card/OerCard.js';
import { type SupportedLanguage } from '../translations.js';
type OerItem = components['schemas']['OerItemSchema'];
export declare class OerListElement extends LitElement {
    static styles: import("lit").CSSResult;
    oers: OerItem[];
    loading: boolean;
    error: string | null;
    language: SupportedLanguage;
    private get t();
    render(): import("lit").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'oer-list': OerListElement;
    }
}
export {};
