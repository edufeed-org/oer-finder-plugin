import { LitElement } from 'lit';
import type { components } from '@oer-aggregator/api-client';
import { type SupportedLanguage } from '../translations.js';
type OerItem = components['schemas']['OerItemSchema'];
export declare class OerCardElement extends LitElement {
    static styles: import("lit").CSSResult;
    oer: OerItem | null;
    onImageClick: ((oer: OerItem) => void) | null;
    language: SupportedLanguage;
    private get t();
    private handleImageClick;
    private getLicenseName;
    render(): import("lit").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'oer-card': OerCardElement;
    }
}
export {};
