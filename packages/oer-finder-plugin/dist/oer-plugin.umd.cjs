(function(l,E){typeof exports=="object"&&typeof module<"u"?E(exports):typeof define=="function"&&define.amd?define(["exports"],E):(l=typeof globalThis<"u"?globalThis:l||self,E(l.OerPlugin={}))})(this,(function(l){"use strict";/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var st;const E=globalThis,ge=E.ShadowRoot&&(E.ShadyCSS===void 0||E.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,fe=Symbol(),Te=new WeakMap;let Pe=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==fe)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(ge&&e===void 0){const s=t!==void 0&&t.length===1;s&&(e=Te.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&Te.set(t,e))}return e}toString(){return this.cssText}};const it=i=>new Pe(typeof i=="string"?i:i+"",void 0,fe),re=(i,...e)=>{const t=i.length===1?i[0]:e.reduce(((s,r,n)=>s+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+i[n+1]),i[0]);return new Pe(t,i,fe)},nt=(i,e)=>{if(ge)i.adoptedStyleSheets=e.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet));else for(const t of e){const s=document.createElement("style"),r=E.litNonce;r!==void 0&&s.setAttribute("nonce",r),s.textContent=t.cssText,i.appendChild(s)}},Ce=ge?i=>i:i=>i instanceof CSSStyleSheet?(e=>{let t="";for(const s of e.cssRules)t+=s.cssText;return it(t)})(i):i;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:at,defineProperty:ot,getOwnPropertyDescriptor:lt,getOwnPropertyNames:ct,getOwnPropertySymbols:dt,getPrototypeOf:ht}=Object,S=globalThis,Oe=S.trustedTypes,pt=Oe?Oe.emptyScript:"",me=S.reactiveElementPolyfillSupport,D=(i,e)=>i,se={toAttribute(i,e){switch(e){case Boolean:i=i?pt:null;break;case Object:case Array:i=i==null?i:JSON.stringify(i)}return i},fromAttribute(i,e){let t=i;switch(e){case Boolean:t=i!==null;break;case Number:t=i===null?null:Number(i);break;case Object:case Array:try{t=JSON.parse(i)}catch{t=null}}return t}},be=(i,e)=>!at(i,e),ke={attribute:!0,type:String,converter:se,reflect:!1,useDefault:!1,hasChanged:be};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),S.litPropertyMetadata??(S.litPropertyMetadata=new WeakMap);let U=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=ke){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const s=Symbol(),r=this.getPropertyDescriptor(e,s,t);r!==void 0&&ot(this.prototype,e,r)}}static getPropertyDescriptor(e,t,s){const{get:r,set:n}=lt(this.prototype,e)??{get(){return this[t]},set(a){this[t]=a}};return{get:r,set(a){const o=r==null?void 0:r.call(this);n==null||n.call(this,a),this.requestUpdate(e,o,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??ke}static _$Ei(){if(this.hasOwnProperty(D("elementProperties")))return;const e=ht(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(D("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(D("properties"))){const t=this.properties,s=[...ct(t),...dt(t)];for(const r of s)this.createProperty(r,t[r])}const e=this[Symbol.metadata];if(e!==null){const t=litPropertyMetadata.get(e);if(t!==void 0)for(const[s,r]of t)this.elementProperties.set(s,r)}this._$Eh=new Map;for(const[t,s]of this.elementProperties){const r=this._$Eu(t,s);r!==void 0&&this._$Eh.set(r,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const s=new Set(e.flat(1/0).reverse());for(const r of s)t.unshift(Ce(r))}else e!==void 0&&t.push(Ce(e));return t}static _$Eu(e,t){const s=t.attribute;return s===!1?void 0:typeof s=="string"?s:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var e;this._$ES=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$E_(),this.requestUpdate(),(e=this.constructor.l)==null||e.forEach((t=>t(this)))}addController(e){var t;(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&((t=e.hostConnected)==null||t.call(e))}removeController(e){var t;(t=this._$EO)==null||t.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const s of t.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return nt(e,this.constructor.elementStyles),e}connectedCallback(){var e;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$EO)==null||e.forEach((t=>{var s;return(s=t.hostConnected)==null?void 0:s.call(t)}))}enableUpdating(e){}disconnectedCallback(){var e;(e=this._$EO)==null||e.forEach((t=>{var s;return(s=t.hostDisconnected)==null?void 0:s.call(t)}))}attributeChangedCallback(e,t,s){this._$AK(e,s)}_$ET(e,t){var n;const s=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,s);if(r!==void 0&&s.reflect===!0){const a=(((n=s.converter)==null?void 0:n.toAttribute)!==void 0?s.converter:se).toAttribute(t,s.type);this._$Em=e,a==null?this.removeAttribute(r):this.setAttribute(r,a),this._$Em=null}}_$AK(e,t){var n,a;const s=this.constructor,r=s._$Eh.get(e);if(r!==void 0&&this._$Em!==r){const o=s.getPropertyOptions(r),d=typeof o.converter=="function"?{fromAttribute:o.converter}:((n=o.converter)==null?void 0:n.fromAttribute)!==void 0?o.converter:se;this._$Em=r;const p=d.fromAttribute(t,o.type);this[r]=p??((a=this._$Ej)==null?void 0:a.get(r))??p,this._$Em=null}}requestUpdate(e,t,s){var r;if(e!==void 0){const n=this.constructor,a=this[e];if(s??(s=n.getPropertyOptions(e)),!((s.hasChanged??be)(a,t)||s.useDefault&&s.reflect&&a===((r=this._$Ej)==null?void 0:r.get(e))&&!this.hasAttribute(n._$Eu(e,s))))return;this.C(e,t,s)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:s,reflect:r,wrapped:n},a){s&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,a??t??this[e]),n!==!0||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||s||(t=void 0),this._$AL.set(e,t)),r===!0&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var s;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[n,a]of this._$Ep)this[n]=a;this._$Ep=void 0}const r=this.constructor.elementProperties;if(r.size>0)for(const[n,a]of r){const{wrapped:o}=a,d=this[n];o!==!0||this._$AL.has(n)||d===void 0||this.C(n,void 0,a,d)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),(s=this._$EO)==null||s.forEach((r=>{var n;return(n=r.hostUpdate)==null?void 0:n.call(r)})),this.update(t)):this._$EM()}catch(r){throw e=!1,this._$EM(),r}e&&this._$AE(t)}willUpdate(e){}_$AE(e){var t;(t=this._$EO)==null||t.forEach((s=>{var r;return(r=s.hostUpdated)==null?void 0:r.call(s)})),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach((t=>this._$ET(t,this[t])))),this._$EM()}updated(e){}firstUpdated(e){}};U.elementStyles=[],U.shadowRootOptions={mode:"open"},U[D("elementProperties")]=new Map,U[D("finalized")]=new Map,me==null||me({ReactiveElement:U}),(S.reactiveElementVersions??(S.reactiveElementVersions=[])).push("2.1.1");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const I=globalThis,ie=I.trustedTypes,ze=ie?ie.createPolicy("lit-html",{createHTML:i=>i}):void 0,Re="$lit$",A=`lit$${Math.random().toFixed(9).slice(2)}$`,Le="?"+A,ut=`<${Le}>`,C=document,F=()=>C.createComment(""),q=i=>i===null||typeof i!="object"&&typeof i!="function",ye=Array.isArray,gt=i=>ye(i)||typeof(i==null?void 0:i[Symbol.iterator])=="function",ve=`[ 	
\f\r]`,W=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ue=/-->/g,Ne=/>/g,O=RegExp(`>|${ve}(?:([^\\s"'>=/]+)(${ve}*=${ve}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),je=/'/g,Me=/"/g,Be=/^(?:script|style|textarea|title)$/i,ft=i=>(e,...t)=>({_$litType$:i,strings:e,values:t}),g=ft(1),N=Symbol.for("lit-noChange"),m=Symbol.for("lit-nothing"),He=new WeakMap,k=C.createTreeWalker(C,129);function De(i,e){if(!ye(i)||!i.hasOwnProperty("raw"))throw Error("invalid template strings array");return ze!==void 0?ze.createHTML(e):e}const mt=(i,e)=>{const t=i.length-1,s=[];let r,n=e===2?"<svg>":e===3?"<math>":"",a=W;for(let o=0;o<t;o++){const d=i[o];let p,u,c=-1,h=0;for(;h<d.length&&(a.lastIndex=h,u=a.exec(d),u!==null);)h=a.lastIndex,a===W?u[1]==="!--"?a=Ue:u[1]!==void 0?a=Ne:u[2]!==void 0?(Be.test(u[2])&&(r=RegExp("</"+u[2],"g")),a=O):u[3]!==void 0&&(a=O):a===O?u[0]===">"?(a=r??W,c=-1):u[1]===void 0?c=-2:(c=a.lastIndex-u[2].length,p=u[1],a=u[3]===void 0?O:u[3]==='"'?Me:je):a===Me||a===je?a=O:a===Ue||a===Ne?a=W:(a=O,r=void 0);const f=a===O&&i[o+1].startsWith("/>")?" ":"";n+=a===W?d+ut:c>=0?(s.push(p),d.slice(0,c)+Re+d.slice(c)+A+f):d+A+(c===-2?o:f)}return[De(i,n+(i[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),s]};class Y{constructor({strings:e,_$litType$:t},s){let r;this.parts=[];let n=0,a=0;const o=e.length-1,d=this.parts,[p,u]=mt(e,t);if(this.el=Y.createElement(p,s),k.currentNode=this.el.content,t===2||t===3){const c=this.el.content.firstChild;c.replaceWith(...c.childNodes)}for(;(r=k.nextNode())!==null&&d.length<o;){if(r.nodeType===1){if(r.hasAttributes())for(const c of r.getAttributeNames())if(c.endsWith(Re)){const h=u[a++],f=r.getAttribute(c).split(A),w=/([.?@])?(.*)/.exec(h);d.push({type:1,index:n,name:w[2],strings:f,ctor:w[1]==="."?yt:w[1]==="?"?vt:w[1]==="@"?xt:ne}),r.removeAttribute(c)}else c.startsWith(A)&&(d.push({type:6,index:n}),r.removeAttribute(c));if(Be.test(r.tagName)){const c=r.textContent.split(A),h=c.length-1;if(h>0){r.textContent=ie?ie.emptyScript:"";for(let f=0;f<h;f++)r.append(c[f],F()),k.nextNode(),d.push({type:2,index:++n});r.append(c[h],F())}}}else if(r.nodeType===8)if(r.data===Le)d.push({type:2,index:n});else{let c=-1;for(;(c=r.data.indexOf(A,c+1))!==-1;)d.push({type:7,index:n}),c+=A.length-1}n++}}static createElement(e,t){const s=C.createElement("template");return s.innerHTML=e,s}}function j(i,e,t=i,s){var a,o;if(e===N)return e;let r=s!==void 0?(a=t._$Co)==null?void 0:a[s]:t._$Cl;const n=q(e)?void 0:e._$litDirective$;return(r==null?void 0:r.constructor)!==n&&((o=r==null?void 0:r._$AO)==null||o.call(r,!1),n===void 0?r=void 0:(r=new n(i),r._$AT(i,t,s)),s!==void 0?(t._$Co??(t._$Co=[]))[s]=r:t._$Cl=r),r!==void 0&&(e=j(i,r._$AS(i,e.values),r,s)),e}class bt{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:s}=this._$AD,r=((e==null?void 0:e.creationScope)??C).importNode(t,!0);k.currentNode=r;let n=k.nextNode(),a=0,o=0,d=s[0];for(;d!==void 0;){if(a===d.index){let p;d.type===2?p=new V(n,n.nextSibling,this,e):d.type===1?p=new d.ctor(n,d.name,d.strings,this,e):d.type===6&&(p=new $t(n,this,e)),this._$AV.push(p),d=s[++o]}a!==(d==null?void 0:d.index)&&(n=k.nextNode(),a++)}return k.currentNode=C,r}p(e){let t=0;for(const s of this._$AV)s!==void 0&&(s.strings!==void 0?(s._$AI(e,s,t),t+=s.strings.length-2):s._$AI(e[t])),t++}}class V{get _$AU(){var e;return((e=this._$AM)==null?void 0:e._$AU)??this._$Cv}constructor(e,t,s,r){this.type=2,this._$AH=m,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=s,this.options=r,this._$Cv=(r==null?void 0:r.isConnected)??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return t!==void 0&&(e==null?void 0:e.nodeType)===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=j(this,e,t),q(e)?e===m||e==null||e===""?(this._$AH!==m&&this._$AR(),this._$AH=m):e!==this._$AH&&e!==N&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):gt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==m&&q(this._$AH)?this._$AA.nextSibling.data=e:this.T(C.createTextNode(e)),this._$AH=e}$(e){var n;const{values:t,_$litType$:s}=e,r=typeof s=="number"?this._$AC(e):(s.el===void 0&&(s.el=Y.createElement(De(s.h,s.h[0]),this.options)),s);if(((n=this._$AH)==null?void 0:n._$AD)===r)this._$AH.p(t);else{const a=new bt(r,this),o=a.u(this.options);a.p(t),this.T(o),this._$AH=a}}_$AC(e){let t=He.get(e.strings);return t===void 0&&He.set(e.strings,t=new Y(e)),t}k(e){ye(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let s,r=0;for(const n of e)r===t.length?t.push(s=new V(this.O(F()),this.O(F()),this,this.options)):s=t[r],s._$AI(n),r++;r<t.length&&(this._$AR(s&&s._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){var s;for((s=this._$AP)==null?void 0:s.call(this,!1,!0,t);e!==this._$AB;){const r=e.nextSibling;e.remove(),e=r}}setConnected(e){var t;this._$AM===void 0&&(this._$Cv=e,(t=this._$AP)==null||t.call(this,e))}}class ne{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,s,r,n){this.type=1,this._$AH=m,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=n,s.length>2||s[0]!==""||s[1]!==""?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=m}_$AI(e,t=this,s,r){const n=this.strings;let a=!1;if(n===void 0)e=j(this,e,t,0),a=!q(e)||e!==this._$AH&&e!==N,a&&(this._$AH=e);else{const o=e;let d,p;for(e=n[0],d=0;d<n.length-1;d++)p=j(this,o[s+d],t,d),p===N&&(p=this._$AH[d]),a||(a=!q(p)||p!==this._$AH[d]),p===m?e=m:e!==m&&(e+=(p??"")+n[d+1]),this._$AH[d]=p}a&&!r&&this.j(e)}j(e){e===m?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class yt extends ne{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===m?void 0:e}}class vt extends ne{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==m)}}class xt extends ne{constructor(e,t,s,r,n){super(e,t,s,r,n),this.type=5}_$AI(e,t=this){if((e=j(this,e,t,0)??m)===N)return;const s=this._$AH,r=e===m&&s!==m||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,n=e!==m&&(s===m||r);r&&this.element.removeEventListener(this.name,this,s),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){var t;typeof this._$AH=="function"?this._$AH.call(((t=this.options)==null?void 0:t.host)??this.element,e):this._$AH.handleEvent(e)}}class $t{constructor(e,t,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){j(this,e)}}const xe=I.litHtmlPolyfillSupport;xe==null||xe(Y,V),(I.litHtmlVersions??(I.litHtmlVersions=[])).push("3.3.1");const wt=(i,e,t)=>{const s=(t==null?void 0:t.renderBefore)??e;let r=s._$litPart$;if(r===void 0){const n=(t==null?void 0:t.renderBefore)??null;s._$litPart$=r=new V(e.insertBefore(F(),n),n,void 0,t??{})}return r._$AI(i),r};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const z=globalThis;class T extends U{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t;const e=super.createRenderRoot();return(t=this.renderOptions).renderBefore??(t.renderBefore=e.firstChild),e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=wt(t,this.renderRoot,this.renderOptions)}connectedCallback(){var e;super.connectedCallback(),(e=this._$Do)==null||e.setConnected(!0)}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._$Do)==null||e.setConnected(!1)}render(){return N}}T._$litElement$=!0,T.finalized=!0,(st=z.litElementHydrateSupport)==null||st.call(z,{LitElement:T});const $e=z.litElementPolyfillSupport;$e==null||$e({LitElement:T}),(z.litElementVersions??(z.litElementVersions=[])).push("4.2.1");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ae=i=>(e,t)=>{t!==void 0?t.addInitializer((()=>{customElements.define(i,e)})):customElements.define(i,e)};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const _t={attribute:!0,type:String,converter:se,reflect:!1,hasChanged:be},Et=(i=_t,e,t)=>{const{kind:s,metadata:r}=t;let n=globalThis.litPropertyMetadata.get(r);if(n===void 0&&globalThis.litPropertyMetadata.set(r,n=new Map),s==="setter"&&((i=Object.create(i)).wrapped=!0),n.set(t.name,i),s==="accessor"){const{name:a}=t;return{set(o){const d=e.get.call(this);e.set.call(this,o),this.requestUpdate(a,d,i)},init(o){return o!==void 0&&this.C(a,void 0,i,o),o}}}if(s==="setter"){const{name:a}=t;return function(o){const d=this[a];e.call(this,o),this.requestUpdate(a,d,i)}}throw Error("Unsupported decorator location: "+s)};function b(i){return(e,t)=>typeof t=="object"?Et(i,e,t):((s,r,n)=>{const a=r.hasOwnProperty(n);return r.constructor.createProperty(n,s),a?Object.getOwnPropertyDescriptor(r,n):void 0})(i,e,t)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function K(i){return b({...i,state:!0,attribute:!1})}const Ie={en:{card:{noDataMessage:"No OER data available",untitledMessage:"Untitled Resource",licenseLabel:"License:",noLicenseMessage:"No license information"},list:{loadingMessage:"Loading resources...",emptyTitle:"No resources found",emptyMessage:"Try adjusting your search criteria or check back later."},pagination:{firstButtonText:"First",previousButtonText:"Previous",nextButtonText:"Next",lastButtonText:"Last",showingPagesText:"Showing",totalResourcesText:"total resources",pageOfText:"Page",ofText:"of"},search:{headerTitle:"Search OER",keywordsLabel:"Keyword search",languageLabel:"Language",licenseLabel:"License",freeForUseLabel:"Free for use",sourceLabel:"Source",typeLabel:"Resource type",keywordsPlaceholder:"Search by keyword...",languagePlaceholder:"e.g., en, de, fr",licensePlaceholder:"License URI...",typePlaceholder:"e.g., image, video, document",searchingText:"Searching...",searchButtonText:"Search",clearButtonText:"Clear",anyOptionText:"Any",yesOptionText:"Yes",noOptionText:"No",firstButtonText:"First",previousButtonText:"Previous",nextButtonText:"Next",lastButtonText:"Last",showingPagesText:"Showing",totalResourcesText:"total resources",pageOfText:"Page",advancedFiltersShowText:"Show advanced filters",advancedFiltersHideText:"Hide advanced filters",errorMessage:"An error occurred"}},de:{card:{noDataMessage:"Keine OER-Daten verfügbar",untitledMessage:"Unbenannte Ressource",licenseLabel:"Lizenz:",noLicenseMessage:"Keine Lizenzinformationen"},list:{loadingMessage:"Ressourcen werden geladen...",emptyTitle:"Keine Ressourcen gefunden",emptyMessage:"Passen Sie Ihre Suchkriterien an oder versuchen Sie es später erneut."},pagination:{firstButtonText:"Erste",previousButtonText:"Zurück",nextButtonText:"Weiter",lastButtonText:"Letzte",showingPagesText:"Angezeigt",totalResourcesText:"Ressourcen insgesamt",pageOfText:"Seite",ofText:"von"},search:{headerTitle:"OER suchen",keywordsLabel:"Stichwortsuche",languageLabel:"Sprache",licenseLabel:"Lizenz",freeForUseLabel:"Kostenlos verfügbar",sourceLabel:"Quelle",typeLabel:"Ressourcentyp",keywordsPlaceholder:"Nach einem Stichwort suchen...",languagePlaceholder:"z.B. de, en, fr",licensePlaceholder:"Lizenz-URI...",typePlaceholder:"z.B. image, video, document",searchingText:"Suche läuft...",searchButtonText:"Suchen",clearButtonText:"Zurücksetzen",anyOptionText:"Alle",yesOptionText:"Ja",noOptionText:"Nein",firstButtonText:"Erste",previousButtonText:"Zurück",nextButtonText:"Weiter",lastButtonText:"Letzte",showingPagesText:"Angezeigt",totalResourcesText:"Ressourcen insgesamt",pageOfText:"Seite",advancedFiltersShowText:"Erweiterte Filter anzeigen",advancedFiltersHideText:"Erweiterte Filter ausblenden",errorMessage:"Ein Fehler ist aufgetreten"}}};function G(i){return Ie[i]||Ie.en}function Fe(i){return G(i).card}function qe(i){return G(i).list}function We(i){return G(i).search}function Ye(i){return G(i).pagination}const oe="nostr",Ve=[{uri:"https://creativecommons.org/publicdomain/zero/1.0/",shortName:"CC0 1.0"},{uri:"https://creativecommons.org/licenses/by/4.0/",shortName:"CC BY 4.0"},{uri:"https://creativecommons.org/licenses/by-sa/4.0/",shortName:"CC BY-SA 4.0"},{uri:"https://creativecommons.org/licenses/by-nd/4.0/",shortName:"CC BY-ND 4.0"},{uri:"https://creativecommons.org/licenses/by-nc/4.0/",shortName:"CC BY-NC 4.0"},{uri:"https://creativecommons.org/licenses/by-nc-sa/4.0/",shortName:"CC BY-NC-SA 4.0"},{uri:"https://creativecommons.org/licenses/by-nc-nd/4.0/",shortName:"CC BY-NC-ND 4.0"},{uri:"https://creativecommons.org/licenses/by/3.0/",shortName:"CC BY 3.0"},{uri:"https://creativecommons.org/licenses/by-sa/3.0/",shortName:"CC BY-SA 3.0"},{uri:"https://creativecommons.org/licenses/by-nd/3.0/",shortName:"CC BY-ND 3.0"},{uri:"https://creativecommons.org/licenses/by-nc/3.0/",shortName:"CC BY-NC 3.0"},{uri:"https://creativecommons.org/licenses/by-nc-sa/3.0/",shortName:"CC BY-NC-SA 3.0"},{uri:"https://creativecommons.org/licenses/by-nc-nd/3.0/",shortName:"CC BY-NC-ND 3.0"}];function St(i){const e=Ve.find(t=>t.uri===i);return e?e.shortName:null}const At=[{code:"en",label:"English"},{code:"de",label:"Deutsch"},{code:"fr",label:"Français"},{code:"it",label:"Italiano"},{code:"es",label:"Español"},{code:"pt",label:"Português"}],Tt=[{value:"image",label:"Image"},{value:"video",label:"Video"},{value:"audio",label:"Audio"},{value:"text",label:"Text"},{value:"application/pdf",label:"PDF"}];function le(i,e){return!i||i.length<=e?i:i.slice(0,e-3)+"..."}function Ke(i){return le(i,40)}function Ge(i){return le(i,60)}function Je(i){return le(i,20)}function Ze(i){return i.slice(0,4).map(e=>{const t=typeof e=="string"?e:String(e);return Je(t)})}const Pt=re`
  :host {
    display: block;
    width: 100%;
    box-sizing: border-box;
  }

  .card {
    border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
    border-radius: 8px;
    overflow: hidden;
    background: var(--background-card);
    box-shadow: 0 2px 4px var(--shadow-color, rgba(0, 0, 0, 0.05));
    transition:
      box-shadow 0.3s ease,
      transform 0.3s ease;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .card:hover {
    box-shadow: 0 8px 16px var(--shadow-color-hover, rgba(0, 0, 0, 0.15));
    transform: translateY(-2px);
  }

  .thumbnail-container {
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: var(--background-muted, #f5f5f5);
    position: relative;
    cursor: pointer;
  }

  .thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s ease;
  }

  .thumbnail-container:hover .thumbnail {
    transform: scale(1.05);
  }

  .placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    color: white;
    font-size: 48px;
  }

  .content {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: var(--text-primary);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .title a {
    color: var(--text-primary);
    text-decoration: none;
  }

  .title a:hover {
    color: var(--primary-color);
    text-decoration: underline;
  }

  .description {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 0 12px 0;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    flex: 1;
  }

  .metadata {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: auto;
  }

  .license {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .license a {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
  }

  .license a:hover {
    text-decoration: underline;
  }

  .keywords {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .keyword {
    background: var(--button-secondary-bg, rgba(0, 0, 0, 0.05));
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    color: var(--text-secondary);
  }

  .attribution {
    font-size: 10px;
    color: var(--text-muted);
    line-height: 1.4;
    margin-top: 4px;
    padding-top: 8px;
    border-top: 1px solid var(--border-color-subtle, rgba(0, 0, 0, 0.05));
  }

  .no-data {
    color: var(--text-muted);
    font-style: italic;
    font-size: 12px;
  }
`;var Ct=Object.defineProperty,Ot=Object.getOwnPropertyDescriptor,we=(i,e,t,s)=>{for(var r=s>1?void 0:s?Ot(e,t):e,n=i.length-1,a;n>=0;n--)(a=i[n])&&(r=(s?a(e,t,r):a(r))||r);return s&&r&&Ct(e,t,r),r};l.OerCardElement=class extends T{constructor(){super(...arguments),this.oer=null,this.language="en"}get t(){return Fe(this.language)}handleImageClick(){this.oer&&this.dispatchEvent(new CustomEvent("card-click",{detail:{oer:this.oer},bubbles:!0,composed:!0}))}getLicenseUrl(e){return e?typeof e=="string"?e:typeof e=="object"&&"id"in e&&typeof e.id=="string"?e.id:null:null}getLicenseName(e){const t=this.getLicenseUrl(e);if(!t)return"Unknown License";const s=St(t);return s||(t.includes("creativecommons.org")?"Creative Commons":"License")}render(){var c,h,f,w,Ee,Z,_,M,R,Q,X,B,H;if(!this.oer)return g`
        <div class="card">
          <div class="content">
            <p class="no-data">${this.t.noDataMessage}</p>
          </div>
        </div>
      `;const e=((h=(c=this.oer.extensions)==null?void 0:c.images)==null?void 0:h.small)??((f=this.oer.amb)==null?void 0:f.image)??null,t=Ke(((w=this.oer.amb)==null?void 0:w.name)||this.t.untitledMessage),s=(Ee=this.oer.amb)==null?void 0:Ee.description,r=typeof s=="string"?s:"",n=r?Ge(r):"",a=((Z=this.oer.amb)==null?void 0:Z.keywords)||[],o=Ze(a),d=(_=this.oer.amb)==null?void 0:_.license,p=(R=(M=this.oer.extensions)==null?void 0:M.system)==null?void 0:R.attribution,u=(X=(Q=this.oer.extensions)==null?void 0:Q.system)==null?void 0:X.foreignLandingUrl;return g`
      <div class="card">
        <div class="thumbnail-container" @click="${this.handleImageClick}">
          ${e?g`<img
                class="thumbnail"
                src="${e}"
                alt="${((H=(B=this.oer.extensions)==null?void 0:B.fileMetadata)==null?void 0:H.fileAlt)||t}"
                loading="lazy"
              />`:g`<div class="placeholder">📚</div>`}
        </div>
        <div class="content">
          <h3 class="title">
            ${u?g`<a href="${u}" target="_blank" rel="noopener noreferrer"
                  >${t}</a
                >`:t}
          </h3>
          ${n?g`<p class="description">${n}</p>`:""}
          <div class="metadata">
            <div class="license">
              ${this.getLicenseUrl(d)?g`${this.t.licenseLabel}
                    <a
                      href="${this.getLicenseUrl(d)}"
                      target="_blank"
                      rel="noopener noreferrer"
                      >${this.getLicenseName(d)}</a
                    >`:g`<span class="no-data">${this.t.noLicenseMessage}</span>`}
            </div>
            ${o&&o.length>0?g`
                  <div class="keywords">
                    ${o.map(ee=>g`<span class="keyword">${ee}</span>`)}
                  </div>
                `:""}
            ${p?g`<div class="attribution">${p}</div>`:""}
          </div>
        </div>
      </div>
    `}},l.OerCardElement.styles=Pt,we([b({type:Object})],l.OerCardElement.prototype,"oer",2),we([b({type:String})],l.OerCardElement.prototype,"language",2),l.OerCardElement=we([ae("oer-card")],l.OerCardElement);const kt=re`
  :host {
    display: block;
    width: 100%;
    box-sizing: border-box;
  }

  .list-container {
    width: 100%;
    margin-bottom: 24px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 18px;
    width: 100%;
  }

  .empty-state {
    text-align: center;
    padding: 48px 24px;
    color: var(--text-secondary);
  }

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  .empty-title {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: var(--text-primary);
  }

  .empty-message {
    font-size: 14px;
    margin: 0;
    color: var(--text-secondary);
  }

  .loading {
    text-align: center;
    padding: 48px 24px;
    color: var(--text-secondary);
  }

  .loading-spinner {
    display: inline-block;
    width: 40px;
    height: 40px;
    border: 4px solid var(--spinner-track-color, #f3f3f3);
    border-top: 4px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .error {
    text-align: center;
    padding: 48px 24px;
    color: var(--error-color, #d32f2f);
  }

  .error-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .error-message {
    font-size: 14px;
    margin: 0;
  }
`;var zt=Object.defineProperty,Rt=Object.getOwnPropertyDescriptor,J=(i,e,t,s)=>{for(var r=s>1?void 0:s?Rt(e,t):e,n=i.length-1,a;n>=0;n--)(a=i[n])&&(r=(s?a(e,t,r):a(r))||r);return s&&r&&zt(e,t,r),r};l.OerListElement=class extends T{constructor(){super(...arguments),this.oers=[],this.loading=!1,this.error=null,this.language="en"}get t(){return qe(this.language)}render(){return this.loading?g`
        <div class="loading">
          <div class="loading-spinner"></div>
          <p>${this.t.loadingMessage}</p>
        </div>
      `:this.error?g`
        <div class="error">
          <div class="error-icon">⚠️</div>
          <p class="error-message">${this.error}</p>
        </div>
      `:!this.oers||this.oers.length===0?g`
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3 class="empty-title">${this.t.emptyTitle}</h3>
          <p class="empty-message">${this.t.emptyMessage}</p>
        </div>
      `:g`
      <div class="list-container">
        <div class="grid">
          ${this.oers.map(e=>g` <oer-card .oer="${e}" .language="${this.language}"></oer-card> `)}
        </div>
      </div>
    `}},l.OerListElement.styles=kt,J([b({type:Array})],l.OerListElement.prototype,"oers",2),J([b({type:Boolean})],l.OerListElement.prototype,"loading",2),J([b({type:String})],l.OerListElement.prototype,"error",2),J([b({type:String})],l.OerListElement.prototype,"language",2),l.OerListElement=J([ae("oer-list")],l.OerListElement);const Lt=/\{[^{}]+\}/g,Ut=()=>{var i,e;return typeof process=="object"&&Number.parseInt((e=(i=process==null?void 0:process.versions)==null?void 0:i.node)==null?void 0:e.substring(0,2))>=18&&process.versions.undici};function Nt(){return Math.random().toString(36).slice(2,11)}function jt(i){let{baseUrl:e="",Request:t=globalThis.Request,fetch:s=globalThis.fetch,querySerializer:r,bodySerializer:n,headers:a,requestInitExt:o=void 0,...d}={...i};o=Ut()?o:void 0,e=rt(e);const p=[];async function u(c,h){const{baseUrl:f,fetch:w=s,Request:Ee=t,headers:Z,params:_={},parseAs:M="json",querySerializer:R,bodySerializer:Q=n??Bt,body:X,...B}=h||{};let H=e;f&&(H=rt(f)??e);let ee=typeof r=="function"?r:et(r);R&&(ee=typeof R=="function"?R:et({...typeof r=="object"?r:{},...R}));const Se=X===void 0?void 0:Q(X,tt(a,Z,_.header)),Kt=tt(Se===void 0||Se instanceof FormData?{}:{"Content-Type":"application/json"},a,Z,_.header),Gt={redirect:"follow",...d,...B,body:Se,headers:Kt};let he,pe,P=new t(Ht(c,{baseUrl:H,params:_,querySerializer:ee}),Gt),y;for(const $ in B)$ in P||(P[$]=B[$]);if(p.length){he=Nt(),pe=Object.freeze({baseUrl:H,fetch:w,parseAs:M,querySerializer:ee,bodySerializer:Q});for(const $ of p)if($&&typeof $=="object"&&typeof $.onRequest=="function"){const v=await $.onRequest({request:P,schemaPath:c,params:_,options:pe,id:he});if(v)if(v instanceof t)P=v;else if(v instanceof Response){y=v;break}else throw new Error("onRequest: must return new Request() or Response() when modifying the request")}}if(!y){try{y=await w(P,o)}catch($){let v=$;if(p.length)for(let L=p.length-1;L>=0;L--){const ue=p[L];if(ue&&typeof ue=="object"&&typeof ue.onError=="function"){const te=await ue.onError({request:P,error:v,schemaPath:c,params:_,options:pe,id:he});if(te){if(te instanceof Response){v=void 0,y=te;break}if(te instanceof Error){v=te;continue}throw new Error("onError: must return new Response() or instance of Error")}}}if(v)throw v}if(p.length)for(let $=p.length-1;$>=0;$--){const v=p[$];if(v&&typeof v=="object"&&typeof v.onResponse=="function"){const L=await v.onResponse({request:P,response:y,schemaPath:c,params:_,options:pe,id:he});if(L){if(!(L instanceof Response))throw new Error("onResponse: must return new Response() when modifying the response");y=L}}}}if(y.status===204||P.method==="HEAD"||y.headers.get("Content-Length")==="0")return y.ok?{data:void 0,response:y}:{error:void 0,response:y};if(y.ok)return M==="stream"?{data:y.body,response:y}:{data:await y[M](),response:y};let Ae=await y.text();try{Ae=JSON.parse(Ae)}catch{}return{error:Ae,response:y}}return{request(c,h,f){return u(h,{...f,method:c.toUpperCase()})},GET(c,h){return u(c,{...h,method:"GET"})},PUT(c,h){return u(c,{...h,method:"PUT"})},POST(c,h){return u(c,{...h,method:"POST"})},DELETE(c,h){return u(c,{...h,method:"DELETE"})},OPTIONS(c,h){return u(c,{...h,method:"OPTIONS"})},HEAD(c,h){return u(c,{...h,method:"HEAD"})},PATCH(c,h){return u(c,{...h,method:"PATCH"})},TRACE(c,h){return u(c,{...h,method:"TRACE"})},use(...c){for(const h of c)if(h){if(typeof h!="object"||!("onRequest"in h||"onResponse"in h||"onError"in h))throw new Error("Middleware must be an object with one of `onRequest()`, `onResponse() or `onError()`");p.push(h)}},eject(...c){for(const h of c){const f=p.indexOf(h);f!==-1&&p.splice(f,1)}}}}function ce(i,e,t){if(e==null)return"";if(typeof e=="object")throw new Error("Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these.");return`${i}=${(t==null?void 0:t.allowReserved)===!0?e:encodeURIComponent(e)}`}function Qe(i,e,t){if(!e||typeof e!="object")return"";const s=[],r={simple:",",label:".",matrix:";"}[t.style]||"&";if(t.style!=="deepObject"&&t.explode===!1){for(const o in e)s.push(o,t.allowReserved===!0?e[o]:encodeURIComponent(e[o]));const a=s.join(",");switch(t.style){case"form":return`${i}=${a}`;case"label":return`.${a}`;case"matrix":return`;${i}=${a}`;default:return a}}for(const a in e){const o=t.style==="deepObject"?`${i}[${a}]`:a;s.push(ce(o,e[a],t))}const n=s.join(r);return t.style==="label"||t.style==="matrix"?`${r}${n}`:n}function Xe(i,e,t){if(!Array.isArray(e))return"";if(t.explode===!1){const n={form:",",spaceDelimited:"%20",pipeDelimited:"|"}[t.style]||",",a=(t.allowReserved===!0?e:e.map(o=>encodeURIComponent(o))).join(n);switch(t.style){case"simple":return a;case"label":return`.${a}`;case"matrix":return`;${i}=${a}`;default:return`${i}=${a}`}}const s={simple:",",label:".",matrix:";"}[t.style]||"&",r=[];for(const n of e)t.style==="simple"||t.style==="label"?r.push(t.allowReserved===!0?n:encodeURIComponent(n)):r.push(ce(i,n,t));return t.style==="label"||t.style==="matrix"?`${s}${r.join(s)}`:r.join(s)}function et(i){return function(t){const s=[];if(t&&typeof t=="object")for(const r in t){const n=t[r];if(n!=null){if(Array.isArray(n)){if(n.length===0)continue;s.push(Xe(r,n,{style:"form",explode:!0,...i==null?void 0:i.array,allowReserved:(i==null?void 0:i.allowReserved)||!1}));continue}if(typeof n=="object"){s.push(Qe(r,n,{style:"deepObject",explode:!0,...i==null?void 0:i.object,allowReserved:(i==null?void 0:i.allowReserved)||!1}));continue}s.push(ce(r,n,i))}}return s.join("&")}}function Mt(i,e){let t=i;for(const s of i.match(Lt)??[]){let r=s.substring(1,s.length-1),n=!1,a="simple";if(r.endsWith("*")&&(n=!0,r=r.substring(0,r.length-1)),r.startsWith(".")?(a="label",r=r.substring(1)):r.startsWith(";")&&(a="matrix",r=r.substring(1)),!e||e[r]===void 0||e[r]===null)continue;const o=e[r];if(Array.isArray(o)){t=t.replace(s,Xe(r,o,{style:a,explode:n}));continue}if(typeof o=="object"){t=t.replace(s,Qe(r,o,{style:a,explode:n}));continue}if(a==="matrix"){t=t.replace(s,`;${ce(r,o)}`);continue}t=t.replace(s,a==="label"?`.${encodeURIComponent(o)}`:encodeURIComponent(o))}return t}function Bt(i,e){return i instanceof FormData?i:e&&(e.get instanceof Function?e.get("Content-Type")??e.get("content-type"):e["Content-Type"]??e["content-type"])==="application/x-www-form-urlencoded"?new URLSearchParams(i).toString():JSON.stringify(i)}function Ht(i,e){var r;let t=`${e.baseUrl}${i}`;(r=e.params)!=null&&r.path&&(t=Mt(t,e.params.path));let s=e.querySerializer(e.params.query??{});return s.startsWith("?")&&(s=s.substring(1)),s&&(t+=`?${s}`),t}function tt(...i){const e=new Headers;for(const t of i){if(!t||typeof t!="object")continue;const s=t instanceof Headers?t.entries():Object.entries(t);for(const[r,n]of s)if(n===null)e.delete(r);else if(Array.isArray(n))for(const a of n)e.append(r,a);else n!==void 0&&e.set(r,n)}return e}function rt(i){return i.endsWith("/")?i.substring(0,i.length-1):i}function _e(i,e){return jt({baseUrl:i.replace(/\/$/,""),headers:e==null?void 0:e.headers,fetch:e==null?void 0:e.fetch})}const Dt=re`
  :host {
    display: block;
    width: 100%;
    box-sizing: border-box;
  }

  .search-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .slot-container {
    margin-top: 24px;
  }

  .slot-container:empty {
    display: none;
    margin-top: 0;
  }

  .search-container {
    background: var(--background-form);
    border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .search-header {
    margin: 0 0 16px 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .search-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  input,
  select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--input-border-color, rgba(0, 0, 0, 0.15));
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.2s ease;
    box-sizing: border-box;
    background: var(--background-input, white);
    color: var(--text-primary);
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  .button-group {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  button {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .search-button {
    background: var(--primary-color);
    color: white;
    flex: 1;
  }

  .search-button:hover:not(:disabled) {
    background: var(--primary-hover-color);
  }

  .search-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .clear-button {
    background: var(--button-secondary-bg, rgba(0, 0, 0, 0.05));
    color: var(--text-secondary);
    flex: 0 0 auto;
  }

  .clear-button:hover {
    background: var(--button-secondary-hover-bg, rgba(0, 0, 0, 0.1));
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: var(--background-form);
    border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
    border-radius: 8px;
    margin-top: 24px;
    gap: 12px;
    flex-wrap: wrap;
  }

  .pagination-info {
    font-size: 14px;
    color: var(--text-secondary);
    flex: 1 1 100%;
    text-align: center;
    margin-bottom: 8px;
  }

  .pagination-controls {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    flex: 1 1 100%;
  }

  .page-button {
    padding: 8px 12px;
    background: var(--button-secondary-bg, rgba(0, 0, 0, 0.05));
    color: var(--text-primary);
    min-width: 40px;
    flex-shrink: 0;
  }

  .page-button:hover:not(:disabled) {
    background: var(--button-secondary-hover-bg, rgba(0, 0, 0, 0.1));
  }

  .page-button:disabled {
    background: var(--button-secondary-bg, rgba(0, 0, 0, 0.05));
    color: var(--text-disabled, rgba(0, 0, 0, 0.3));
    cursor: not-allowed;
  }

  .page-info {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 8px;
    white-space: nowrap;
  }

  /* Mobile responsive styles */
  @media (max-width: 768px) {
    .search-container {
      padding: 16px;
    }

    .pagination {
      padding: 12px;
      flex-direction: column;
    }

    .pagination-info {
      margin-bottom: 12px;
      font-size: 13px;
    }

    .pagination-controls {
      gap: 6px;
      width: 100%;
    }

    .page-button {
      padding: 8px 10px;
      font-size: 13px;
      min-width: 60px;
      flex: 1 1 auto;
    }

    .page-info {
      flex-basis: 100%;
      text-align: center;
      margin: 8px 0;
      font-size: 13px;
    }

    .button-group {
      flex-direction: column;
    }

    .search-button,
    .clear-button {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .search-container {
      padding: 12px;
    }

    .pagination {
      padding: 10px;
    }

    .pagination-info {
      font-size: 12px;
    }

    .pagination-controls {
      gap: 4px;
    }

    .page-button {
      padding: 6px 8px;
      font-size: 12px;
      min-width: 50px;
    }

    .page-info {
      font-size: 12px;
      margin: 6px 0;
    }

    .form-row {
      grid-template-columns: 1fr;
    }
  }

  .error-message {
    background: #ffebee;
    color: #c62828;
    padding: 12px 16px;
    border-radius: 6px;
    margin-top: 12px;
    font-size: 14px;
  }

  .toggle-filters-button {
    background: transparent;
    color: var(--primary-color);
    padding: 8px 0;
    font-size: 14px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
  }

  .toggle-filters-button::before {
    content: '▶';
    display: inline-block;
    transition: transform 0.2s ease;
    font-size: 10px;
  }

  .toggle-filters-button:hover {
    color: var(--primary-hover-color);
  }

  .advanced-filters {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .advanced-filters.expanded {
    max-height: 1000px;
  }

  .advanced-filters.expanded ~ .toggle-filters-button::before,
  .toggle-filters-button:has(~ .advanced-filters.expanded)::before {
    transform: rotate(90deg);
  }

  /* Fix the button state when filters are expanded */
  form:has(.advanced-filters.expanded) .toggle-filters-button::before {
    transform: rotate(90deg);
  }
`;var It=Object.defineProperty,Ft=Object.getOwnPropertyDescriptor,x=(i,e,t,s)=>{for(var r=s>1?void 0:s?Ft(e,t):e,n=i.length-1,a;n>=0;n--)(a=i[n])&&(r=(s?a(e,t,r):a(r))||r);return s&&r&&It(e,t,r),r};l.OerSearchElement=class extends T{constructor(){super(...arguments),this.apiUrl="http://localhost:3000",this.language="en",this.showTypeFilter=!0,this.pageSize=20,this.availableSources=[],this.showSourceFilter=!0,this.client=null,this.searchParams={page:1,source:oe},this.loading=!1,this.error=null,this.advancedFiltersExpanded=!1,this.handleSlottedPageChange=e=>{const t=e;e.stopPropagation(),this.searchParams={...this.searchParams,page:t.detail.page},this.performSearch()}}get t(){return We(this.language)}connectedCallback(){super.connectedCallback(),this.client=_e(this.apiUrl),this.searchParams={...this.searchParams,pageSize:this.pageSize},this.lockedType&&(this.searchParams={...this.searchParams,type:this.lockedType}),this.lockedSource&&(this.searchParams={...this.searchParams,source:this.lockedSource}),this.addEventListener("page-change",this.handleSlottedPageChange)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("page-change",this.handleSlottedPageChange)}updated(e){if(super.updated(e),e.has("apiUrl")&&(this.client=_e(this.apiUrl)),e.has("pageSize")&&(this.searchParams={...this.searchParams,pageSize:this.pageSize}),e.has("lockedType"))if(this.lockedType)this.searchParams={...this.searchParams,type:this.lockedType};else{const{type:t,...s}=this.searchParams;this.searchParams=s}e.has("lockedSource")&&(this.lockedSource?this.searchParams={...this.searchParams,source:this.lockedSource}:this.searchParams={...this.searchParams,source:oe})}async performSearch(){if(this.client){this.loading=!0,this.error=null;try{const e=await this.client.GET("/api/v1/oer",{params:{query:this.searchParams}});if(e.error){const t=e.error.message?Array.isArray(e.error.message)?e.error.message.join(", "):e.error.message:"Failed to fetch resources";throw new Error(t)}e.data&&this.dispatchEvent(new CustomEvent("search-results",{detail:{data:e.data.data,meta:e.data.meta},bubbles:!0,composed:!0}))}catch(e){this.error=e instanceof Error?e.message:this.t.errorMessage,this.dispatchEvent(new CustomEvent("search-error",{detail:{error:this.error},bubbles:!0,composed:!0}))}finally{this.loading=!1}}}handleSubmit(e){e.preventDefault(),this.searchParams={...this.searchParams,page:1},this.performSearch()}handleClear(){this.searchParams={page:1,pageSize:this.pageSize,source:this.lockedSource||oe},this.lockedType&&(this.searchParams={...this.searchParams,type:this.lockedType}),this.error=null,this.dispatchEvent(new CustomEvent("search-cleared",{bubbles:!0,composed:!0}))}handleInputChange(e){return t=>{const r=t.target.value.trim();if(r===""){const{[e]:n,...a}=this.searchParams;this.searchParams=a}else this.searchParams={...this.searchParams,[e]:r}}}handleBooleanChange(e){return t=>{const r=t.target.value;if(r===""){const{[e]:n,...a}=this.searchParams;this.searchParams=a}else this.searchParams={...this.searchParams,[e]:r==="true"}}}toggleAdvancedFilters(){this.advancedFiltersExpanded=!this.advancedFiltersExpanded}render(){return g`
      <div class="search-wrapper">
        <div class="search-container">
          <h2 class="search-header">${this.t.headerTitle}</h2>
          <form class="search-form" @submit="${this.handleSubmit}">
            <div class="form-group">
              <label for="searchTerm">${this.t.keywordsLabel}</label>
              <input
                id="searchTerm"
                type="text"
                placeholder="${this.t.keywordsPlaceholder}"
                .value="${this.searchParams.searchTerm||""}"
                @input="${this.handleInputChange("searchTerm")}"
                required
              />
            </div>

            ${this.showTypeFilter&&!this.lockedType?g`
                  <div class="form-group">
                    <label for="type">${this.t.typeLabel}</label>
                    <select
                      id="type"
                      .value="${this.searchParams.type||""}"
                      @change="${this.handleInputChange("type")}"
                    >
                      <option value="">${this.t.anyOptionText}</option>
                      ${Tt.map(e=>g` <option value="${e.value}">${e.label}</option> `)}
                    </select>
                  </div>
                `:""}

            <button
              type="button"
              class="toggle-filters-button"
              @click="${this.toggleAdvancedFilters}"
            >
              ${this.advancedFiltersExpanded?this.t.advancedFiltersHideText:this.t.advancedFiltersShowText}
            </button>

            <div class="advanced-filters ${this.advancedFiltersExpanded?"expanded":""}">
              <div class="form-row">
                <div class="form-group">
                  <label for="language">${this.t.languageLabel}</label>
                  <select
                    id="language"
                    .value="${this.searchParams.language||""}"
                    @change="${this.handleInputChange("language")}"
                  >
                    <option value="">${this.t.anyOptionText}</option>
                    ${At.map(e=>g` <option value="${e.code}">${e.label}</option> `)}
                  </select>
                </div>

                <div class="form-group">
                  <label for="license">${this.t.licenseLabel}</label>
                  <select
                    id="license"
                    .value="${this.searchParams.license||""}"
                    @change="${this.handleInputChange("license")}"
                  >
                    <option value="">${this.t.anyOptionText}</option>
                    ${Ve.map(e=>g`
                        <option value="${e.uri}">${e.shortName}</option>
                      `)}
                  </select>
                </div>
              </div>

              ${this.showSourceFilter&&!this.lockedSource&&this.availableSources.length>0?g`
                    <div class="form-group">
                      <label for="source">${this.t.sourceLabel}</label>
                      <select
                        id="source"
                        .value="${this.searchParams.source||oe}"
                        @change="${this.handleInputChange("source")}"
                      >
                        ${this.availableSources.map(e=>g`
                            <option value="${e.value}">${e.label}</option>
                          `)}
                      </select>
                    </div>
                  `:""}
            </div>

            <div class="button-group">
              <button type="submit" class="search-button" ?disabled="${this.loading}">
                ${this.loading?this.t.searchingText:this.t.searchButtonText}
              </button>
              <button type="button" class="clear-button" @click="${this.handleClear}">
                ${this.t.clearButtonText}
              </button>
            </div>

            ${this.error?g`<div class="error-message">${this.error}</div>`:""}
          </form>
        </div>
        <div class="slot-container">
          <slot></slot>
        </div>
      </div>
    `}},l.OerSearchElement.styles=Dt,x([b({type:String,attribute:"api-url"})],l.OerSearchElement.prototype,"apiUrl",2),x([b({type:String})],l.OerSearchElement.prototype,"language",2),x([b({type:String,attribute:"locked-type"})],l.OerSearchElement.prototype,"lockedType",2),x([b({type:Boolean,attribute:"show-type-filter"})],l.OerSearchElement.prototype,"showTypeFilter",2),x([b({type:Number,attribute:"page-size"})],l.OerSearchElement.prototype,"pageSize",2),x([b({type:Array,attribute:"available-sources"})],l.OerSearchElement.prototype,"availableSources",2),x([b({type:String,attribute:"locked-source"})],l.OerSearchElement.prototype,"lockedSource",2),x([b({type:Boolean,attribute:"show-source-filter"})],l.OerSearchElement.prototype,"showSourceFilter",2),x([K()],l.OerSearchElement.prototype,"client",2),x([K()],l.OerSearchElement.prototype,"searchParams",2),x([K()],l.OerSearchElement.prototype,"loading",2),x([K()],l.OerSearchElement.prototype,"error",2),x([K()],l.OerSearchElement.prototype,"advancedFiltersExpanded",2),l.OerSearchElement=x([ae("oer-search")],l.OerSearchElement);const qt=re`
  :host {
    display: block;
    width: 100%;
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: var(--background-form);
    border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
    border-radius: 8px;
    gap: 12px;
    flex-wrap: wrap;
  }

  .pagination-info {
    font-size: 14px;
    color: var(--text-secondary);
    flex: 1 1 100%;
    text-align: center;
    margin-bottom: 8px;
  }

  .pagination-controls {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    flex: 1 1 100%;
  }

  .page-button {
    padding: 8px 12px;
    background: var(--button-secondary-bg, rgba(0, 0, 0, 0.05));
    color: var(--text-primary);
    min-width: 40px;
    flex-shrink: 0;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .page-button:hover:not(:disabled) {
    background: var(--button-secondary-hover-bg, rgba(0, 0, 0, 0.1));
  }

  .page-button:disabled {
    background: var(--button-secondary-bg, rgba(0, 0, 0, 0.05));
    color: var(--text-disabled, rgba(0, 0, 0, 0.3));
    cursor: not-allowed;
  }

  .page-info {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 8px;
    white-space: nowrap;
  }

  /* Mobile responsive styles */
  @media (max-width: 768px) {
    .pagination {
      padding: 12px;
      flex-direction: column;
    }

    .pagination-info {
      margin-bottom: 12px;
      font-size: 13px;
    }

    .pagination-controls {
      gap: 6px;
      width: 100%;
    }

    .page-button {
      padding: 8px 10px;
      font-size: 13px;
      min-width: 60px;
      flex: 1 1 auto;
    }

    .page-info {
      flex-basis: 100%;
      text-align: center;
      margin: 8px 0;
      font-size: 13px;
    }
  }

  @media (max-width: 480px) {
    .pagination {
      padding: 10px;
    }

    .pagination-info {
      font-size: 12px;
    }

    .pagination-controls {
      gap: 4px;
    }

    .page-button {
      padding: 6px 8px;
      font-size: 12px;
      min-width: 50px;
    }

    .page-info {
      font-size: 12px;
      margin: 6px 0;
    }
  }
`;var Wt=Object.defineProperty,Yt=Object.getOwnPropertyDescriptor,de=(i,e,t,s)=>{for(var r=s>1?void 0:s?Yt(e,t):e,n=i.length-1,a;n>=0;n--)(a=i[n])&&(r=(s?a(e,t,r):a(r))||r);return s&&r&&Wt(e,t,r),r};l.PaginationElement=class extends T{constructor(){super(...arguments),this.metadata=null,this.loading=!1,this.language="en"}get t(){return Ye(this.language)}render(){return this.metadata?g`
      <div class="pagination">
        <div class="pagination-info">
          ${this.t.showingPagesText} ${this.t.pageOfText.toLowerCase()} ${this.metadata.page}
          ${this.t.ofText} ${this.metadata.totalPages} (${this.metadata.total}
          ${this.t.totalResourcesText})
        </div>
        <div class="pagination-controls">
          <button
            type="button"
            class="page-button"
            ?disabled="${this.metadata.page===1||this.loading}"
            @click="${()=>this.handlePageChange(1)}"
          >
            ${this.t.firstButtonText}
          </button>
          <button
            type="button"
            class="page-button"
            ?disabled="${this.metadata.page===1||this.loading}"
            @click="${()=>this.handlePageChange(this.metadata.page-1)}"
          >
            ${this.t.previousButtonText}
          </button>
          <span class="page-info"
            >${this.t.pageOfText} ${this.metadata.page} ${this.t.ofText}
            ${this.metadata.totalPages}</span
          >
          <button
            type="button"
            class="page-button"
            ?disabled="${this.metadata.page===this.metadata.totalPages||this.loading}"
            @click="${()=>this.handlePageChange(this.metadata.page+1)}"
          >
            ${this.t.nextButtonText}
          </button>
          <button
            type="button"
            class="page-button"
            ?disabled="${this.metadata.page===this.metadata.totalPages||this.loading}"
            @click="${()=>this.handlePageChange(this.metadata.totalPages)}"
          >
            ${this.t.lastButtonText}
          </button>
        </div>
      </div>
    `:""}handlePageChange(e){this.dispatchEvent(new CustomEvent("page-change",{detail:{page:e},bubbles:!0,composed:!0}))}},l.PaginationElement.styles=qt,de([b({type:Object})],l.PaginationElement.prototype,"metadata",2),de([b({type:Boolean})],l.PaginationElement.prototype,"loading",2),de([b({type:String})],l.PaginationElement.prototype,"language",2),l.PaginationElement=de([ae("oer-pagination")],l.PaginationElement);const Vt="0.0.1";l.VERSION=Vt,l.createOerClient=_e,l.getCardTranslations=Fe,l.getListTranslations=qe,l.getPaginationTranslations=Ye,l.getSearchTranslations=We,l.getTranslations=G,l.shortenLabels=Ze,l.truncateContent=Ge,l.truncateLabel=Je,l.truncateText=le,l.truncateTitle=Ke,Object.defineProperty(l,Symbol.toStringTag,{value:"Module"})}));
