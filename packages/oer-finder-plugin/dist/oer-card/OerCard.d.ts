import { LitElement } from 'lit';
import type { components } from '@edufeed-org/oer-finder-api-client';
import { type SupportedLanguage } from '../translations.js';
type OerItem = components['schemas']['OerItemSchema'];
export interface OerCardClickEvent {
    oer: OerItem;
}
export declare class OerCardElement extends LitElement {
    static styles: import("lit").CSSResult;
    oer: OerItem | null;
    language: SupportedLanguage;
    private get t();
    private handleImageClick;
    private getLicenseUrl;
    private getLicenseName;
    render(): import("lit").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'oer-card': OerCardElement;
    }
}
export {};
