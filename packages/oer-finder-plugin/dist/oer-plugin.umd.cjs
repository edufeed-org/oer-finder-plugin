(function(o,P){typeof exports=="object"&&typeof module<"u"?P(exports):typeof define=="function"&&define.amd?define(["exports"],P):(o=typeof globalThis<"u"?globalThis:o||self,P(o.OerPlugin={}))})(this,(function(o){"use strict";/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var nt;const P=globalThis,le=P.ShadowRoot&&(P.ShadyCSS===void 0||P.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ce=Symbol(),Ee=new WeakMap;let Pe=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==ce)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(le&&e===void 0){const i=t!==void 0&&t.length===1;i&&(e=Ee.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&Ee.set(t,e))}return e}toString(){return this.cssText}};const lt=n=>new Pe(typeof n=="string"?n:n+"",void 0,ce),G=(n,...e)=>{const t=n.length===1?n[0]:e.reduce(((i,r,s)=>i+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+n[s+1]),n[0]);return new Pe(t,n,ce)},ct=(n,e)=>{if(le)n.adoptedStyleSheets=e.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet));else for(const t of e){const i=document.createElement("style"),r=P.litNonce;r!==void 0&&i.setAttribute("nonce",r),i.textContent=t.cssText,n.appendChild(i)}},Se=le?n=>n:n=>n instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return lt(t)})(n):n;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:ht,defineProperty:dt,getOwnPropertyDescriptor:pt,getOwnPropertyNames:ut,getOwnPropertySymbols:ft,getPrototypeOf:gt}=Object,S=globalThis,Ce=S.trustedTypes,mt=Ce?Ce.emptyScript:"",he=S.reactiveElementPolyfillSupport,M=(n,e)=>n,Q={toAttribute(n,e){switch(e){case Boolean:n=n?mt:null;break;case Object:case Array:n=n==null?n:JSON.stringify(n)}return n},fromAttribute(n,e){let t=n;switch(e){case Boolean:t=n!==null;break;case Number:t=n===null?null:Number(n);break;case Object:case Array:try{t=JSON.parse(n)}catch{t=null}}return t}},de=(n,e)=>!ht(n,e),Te={attribute:!0,type:String,converter:Q,reflect:!1,useDefault:!1,hasChanged:de};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),S.litPropertyMetadata??(S.litPropertyMetadata=new WeakMap);let L=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Te){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),r=this.getPropertyDescriptor(e,i,t);r!==void 0&&dt(this.prototype,e,r)}}static getPropertyDescriptor(e,t,i){const{get:r,set:s}=pt(this.prototype,e)??{get(){return this[t]},set(a){this[t]=a}};return{get:r,set(a){const l=r==null?void 0:r.call(this);s==null||s.call(this,a),this.requestUpdate(e,l,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Te}static _$Ei(){if(this.hasOwnProperty(M("elementProperties")))return;const e=gt(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(M("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(M("properties"))){const t=this.properties,i=[...ut(t),...ft(t)];for(const r of i)this.createProperty(r,t[r])}const e=this[Symbol.metadata];if(e!==null){const t=litPropertyMetadata.get(e);if(t!==void 0)for(const[i,r]of t)this.elementProperties.set(i,r)}this._$Eh=new Map;for(const[t,i]of this.elementProperties){const r=this._$Eu(t,i);r!==void 0&&this._$Eh.set(r,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const r of i)t.unshift(Se(r))}else e!==void 0&&t.push(Se(e));return t}static _$Eu(e,t){const i=t.attribute;return i===!1?void 0:typeof i=="string"?i:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var e;this._$ES=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$E_(),this.requestUpdate(),(e=this.constructor.l)==null||e.forEach((t=>t(this)))}addController(e){var t;(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&((t=e.hostConnected)==null||t.call(e))}removeController(e){var t;(t=this._$EO)==null||t.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ct(e,this.constructor.elementStyles),e}connectedCallback(){var e;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$EO)==null||e.forEach((t=>{var i;return(i=t.hostConnected)==null?void 0:i.call(t)}))}enableUpdating(e){}disconnectedCallback(){var e;(e=this._$EO)==null||e.forEach((t=>{var i;return(i=t.hostDisconnected)==null?void 0:i.call(t)}))}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){var s;const i=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,i);if(r!==void 0&&i.reflect===!0){const a=(((s=i.converter)==null?void 0:s.toAttribute)!==void 0?i.converter:Q).toAttribute(t,i.type);this._$Em=e,a==null?this.removeAttribute(r):this.setAttribute(r,a),this._$Em=null}}_$AK(e,t){var s,a;const i=this.constructor,r=i._$Eh.get(e);if(r!==void 0&&this._$Em!==r){const l=i.getPropertyOptions(r),h=typeof l.converter=="function"?{fromAttribute:l.converter}:((s=l.converter)==null?void 0:s.fromAttribute)!==void 0?l.converter:Q;this._$Em=r;const p=h.fromAttribute(t,l.type);this[r]=p??((a=this._$Ej)==null?void 0:a.get(r))??p,this._$Em=null}}requestUpdate(e,t,i){var r;if(e!==void 0){const s=this.constructor,a=this[e];if(i??(i=s.getPropertyOptions(e)),!((i.hasChanged??de)(a,t)||i.useDefault&&i.reflect&&a===((r=this._$Ej)==null?void 0:r.get(e))&&!this.hasAttribute(s._$Eu(e,i))))return;this.C(e,t,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:r,wrapped:s},a){i&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,a??t??this[e]),s!==!0||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),r===!0&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var i;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[s,a]of this._$Ep)this[s]=a;this._$Ep=void 0}const r=this.constructor.elementProperties;if(r.size>0)for(const[s,a]of r){const{wrapped:l}=a,h=this[s];l!==!0||this._$AL.has(s)||h===void 0||this.C(s,void 0,a,h)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),(i=this._$EO)==null||i.forEach((r=>{var s;return(s=r.hostUpdate)==null?void 0:s.call(r)})),this.update(t)):this._$EM()}catch(r){throw e=!1,this._$EM(),r}e&&this._$AE(t)}willUpdate(e){}_$AE(e){var t;(t=this._$EO)==null||t.forEach((i=>{var r;return(r=i.hostUpdated)==null?void 0:r.call(i)})),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach((t=>this._$ET(t,this[t])))),this._$EM()}updated(e){}firstUpdated(e){}};L.elementStyles=[],L.shadowRootOptions={mode:"open"},L[M("elementProperties")]=new Map,L[M("finalized")]=new Map,he==null||he({ReactiveElement:L}),(S.reactiveElementVersions??(S.reactiveElementVersions=[])).push("2.1.1");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const H=globalThis,X=H.trustedTypes,Ae=X?X.createPolicy("lit-html",{createHTML:n=>n}):void 0,Oe="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,ke="?"+C,yt=`<${ke}>`,A=document,D=()=>A.createComment(""),I=n=>n===null||typeof n!="object"&&typeof n!="function",pe=Array.isArray,bt=n=>pe(n)||typeof(n==null?void 0:n[Symbol.iterator])=="function",ue=`[ 	
\f\r]`,F=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ze=/-->/g,Re=/>/g,O=RegExp(`>|${ue}(?:([^\\s"'>=/]+)(${ue}*=${ue}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Le=/'/g,Ne=/"/g,Ue=/^(?:script|style|textarea|title)$/i,$t=n=>(e,...t)=>({_$litType$:n,strings:e,values:t}),g=$t(1),N=Symbol.for("lit-noChange"),y=Symbol.for("lit-nothing"),je=new WeakMap,k=A.createTreeWalker(A,129);function Be(n,e){if(!pe(n)||!n.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ae!==void 0?Ae.createHTML(e):e}const xt=(n,e)=>{const t=n.length-1,i=[];let r,s=e===2?"<svg>":e===3?"<math>":"",a=F;for(let l=0;l<t;l++){const h=n[l];let p,u,c=-1,d=0;for(;d<h.length&&(a.lastIndex=d,u=a.exec(h),u!==null);)d=a.lastIndex,a===F?u[1]==="!--"?a=ze:u[1]!==void 0?a=Re:u[2]!==void 0?(Ue.test(u[2])&&(r=RegExp("</"+u[2],"g")),a=O):u[3]!==void 0&&(a=O):a===O?u[0]===">"?(a=r??F,c=-1):u[1]===void 0?c=-2:(c=a.lastIndex-u[2].length,p=u[1],a=u[3]===void 0?O:u[3]==='"'?Ne:Le):a===Ne||a===Le?a=O:a===ze||a===Re?a=F:(a=O,r=void 0);const m=a===O&&n[l+1].startsWith("/>")?" ":"";s+=a===F?h+yt:c>=0?(i.push(p),h.slice(0,c)+Oe+h.slice(c)+C+m):h+C+(c===-2?l:m)}return[Be(n,s+(n[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),i]};class q{constructor({strings:e,_$litType$:t},i){let r;this.parts=[];let s=0,a=0;const l=e.length-1,h=this.parts,[p,u]=xt(e,t);if(this.el=q.createElement(p,i),k.currentNode=this.el.content,t===2||t===3){const c=this.el.content.firstChild;c.replaceWith(...c.childNodes)}for(;(r=k.nextNode())!==null&&h.length<l;){if(r.nodeType===1){if(r.hasAttributes())for(const c of r.getAttributeNames())if(c.endsWith(Oe)){const d=u[a++],m=r.getAttribute(c).split(C),E=/([.?@])?(.*)/.exec(d);h.push({type:1,index:s,name:E[2],strings:m,ctor:E[1]==="."?_t:E[1]==="?"?wt:E[1]==="@"?Et:ee}),r.removeAttribute(c)}else c.startsWith(C)&&(h.push({type:6,index:s}),r.removeAttribute(c));if(Ue.test(r.tagName)){const c=r.textContent.split(C),d=c.length-1;if(d>0){r.textContent=X?X.emptyScript:"";for(let m=0;m<d;m++)r.append(c[m],D()),k.nextNode(),h.push({type:2,index:++s});r.append(c[d],D())}}}else if(r.nodeType===8)if(r.data===ke)h.push({type:2,index:s});else{let c=-1;for(;(c=r.data.indexOf(C,c+1))!==-1;)h.push({type:7,index:s}),c+=C.length-1}s++}}static createElement(e,t){const i=A.createElement("template");return i.innerHTML=e,i}}function U(n,e,t=n,i){var a,l;if(e===N)return e;let r=i!==void 0?(a=t._$Co)==null?void 0:a[i]:t._$Cl;const s=I(e)?void 0:e._$litDirective$;return(r==null?void 0:r.constructor)!==s&&((l=r==null?void 0:r._$AO)==null||l.call(r,!1),s===void 0?r=void 0:(r=new s(n),r._$AT(n,t,i)),i!==void 0?(t._$Co??(t._$Co=[]))[i]=r:t._$Cl=r),r!==void 0&&(e=U(n,r._$AS(n,e.values),r,i)),e}class vt{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,r=((e==null?void 0:e.creationScope)??A).importNode(t,!0);k.currentNode=r;let s=k.nextNode(),a=0,l=0,h=i[0];for(;h!==void 0;){if(a===h.index){let p;h.type===2?p=new W(s,s.nextSibling,this,e):h.type===1?p=new h.ctor(s,h.name,h.strings,this,e):h.type===6&&(p=new Pt(s,this,e)),this._$AV.push(p),h=i[++l]}a!==(h==null?void 0:h.index)&&(s=k.nextNode(),a++)}return k.currentNode=A,r}p(e){let t=0;for(const i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class W{get _$AU(){var e;return((e=this._$AM)==null?void 0:e._$AU)??this._$Cv}constructor(e,t,i,r){this.type=2,this._$AH=y,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=r,this._$Cv=(r==null?void 0:r.isConnected)??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return t!==void 0&&(e==null?void 0:e.nodeType)===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=U(this,e,t),I(e)?e===y||e==null||e===""?(this._$AH!==y&&this._$AR(),this._$AH=y):e!==this._$AH&&e!==N&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):bt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==y&&I(this._$AH)?this._$AA.nextSibling.data=e:this.T(A.createTextNode(e)),this._$AH=e}$(e){var s;const{values:t,_$litType$:i}=e,r=typeof i=="number"?this._$AC(e):(i.el===void 0&&(i.el=q.createElement(Be(i.h,i.h[0]),this.options)),i);if(((s=this._$AH)==null?void 0:s._$AD)===r)this._$AH.p(t);else{const a=new vt(r,this),l=a.u(this.options);a.p(t),this.T(l),this._$AH=a}}_$AC(e){let t=je.get(e.strings);return t===void 0&&je.set(e.strings,t=new q(e)),t}k(e){pe(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,r=0;for(const s of e)r===t.length?t.push(i=new W(this.O(D()),this.O(D()),this,this.options)):i=t[r],i._$AI(s),r++;r<t.length&&(this._$AR(i&&i._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){var i;for((i=this._$AP)==null?void 0:i.call(this,!1,!0,t);e!==this._$AB;){const r=e.nextSibling;e.remove(),e=r}}setConnected(e){var t;this._$AM===void 0&&(this._$Cv=e,(t=this._$AP)==null||t.call(this,e))}}class ee{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,r,s){this.type=1,this._$AH=y,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=s,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=y}_$AI(e,t=this,i,r){const s=this.strings;let a=!1;if(s===void 0)e=U(this,e,t,0),a=!I(e)||e!==this._$AH&&e!==N,a&&(this._$AH=e);else{const l=e;let h,p;for(e=s[0],h=0;h<s.length-1;h++)p=U(this,l[i+h],t,h),p===N&&(p=this._$AH[h]),a||(a=!I(p)||p!==this._$AH[h]),p===y?e=y:e!==y&&(e+=(p??"")+s[h+1]),this._$AH[h]=p}a&&!r&&this.j(e)}j(e){e===y?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class _t extends ee{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===y?void 0:e}}class wt extends ee{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==y)}}class Et extends ee{constructor(e,t,i,r,s){super(e,t,i,r,s),this.type=5}_$AI(e,t=this){if((e=U(this,e,t,0)??y)===N)return;const i=this._$AH,r=e===y&&i!==y||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,s=e!==y&&(i===y||r);r&&this.element.removeEventListener(this.name,this,i),s&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){var t;typeof this._$AH=="function"?this._$AH.call(((t=this.options)==null?void 0:t.host)??this.element,e):this._$AH.handleEvent(e)}}class Pt{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){U(this,e)}}const fe=H.litHtmlPolyfillSupport;fe==null||fe(q,W),(H.litHtmlVersions??(H.litHtmlVersions=[])).push("3.3.1");const St=(n,e,t)=>{const i=(t==null?void 0:t.renderBefore)??e;let r=i._$litPart$;if(r===void 0){const s=(t==null?void 0:t.renderBefore)??null;i._$litPart$=r=new W(e.insertBefore(D(),s),s,void 0,t??{})}return r._$AI(n),r};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const z=globalThis;class _ extends L{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t;const e=super.createRenderRoot();return(t=this.renderOptions).renderBefore??(t.renderBefore=e.firstChild),e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=St(t,this.renderRoot,this.renderOptions)}connectedCallback(){var e;super.connectedCallback(),(e=this._$Do)==null||e.setConnected(!0)}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._$Do)==null||e.setConnected(!1)}render(){return N}}_._$litElement$=!0,_.finalized=!0,(nt=z.litElementHydrateSupport)==null||nt.call(z,{LitElement:_});const ge=z.litElementPolyfillSupport;ge==null||ge({LitElement:_}),(z.litElementVersions??(z.litElementVersions=[])).push("4.2.1");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const V=n=>(e,t)=>{t!==void 0?t.addInitializer((()=>{customElements.define(n,e)})):customElements.define(n,e)};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Ct={attribute:!0,type:String,converter:Q,reflect:!1,hasChanged:de},Tt=(n=Ct,e,t)=>{const{kind:i,metadata:r}=t;let s=globalThis.litPropertyMetadata.get(r);if(s===void 0&&globalThis.litPropertyMetadata.set(r,s=new Map),i==="setter"&&((n=Object.create(n)).wrapped=!0),s.set(t.name,n),i==="accessor"){const{name:a}=t;return{set(l){const h=e.get.call(this);e.set.call(this,l),this.requestUpdate(a,h,n)},init(l){return l!==void 0&&this.C(a,void 0,n,l),l}}}if(i==="setter"){const{name:a}=t;return function(l){const h=this[a];e.call(this,l),this.requestUpdate(a,h,n)}}throw Error("Unsupported decorator location: "+i)};function f(n){return(e,t)=>typeof t=="object"?Tt(n,e,t):((i,r,s)=>{const a=r.hasOwnProperty(s);return r.constructor.createProperty(s,i),a?Object.getOwnPropertyDescriptor(r,s):void 0})(n,e,t)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function Y(n){return f({...n,state:!0,attribute:!1})}const Me={en:{card:{noDataMessage:"No OER data available",untitledMessage:"Untitled Resource",licenseLabel:"License:",noLicenseMessage:"No license information"},list:{loadingMessage:"Loading resources...",emptyTitle:"No resources found",emptyMessage:"Try adjusting your search criteria or check back later."},pagination:{firstButtonText:"First",previousButtonText:"Previous",nextButtonText:"Next",lastButtonText:"Last",showingPagesText:"Showing",totalResourcesText:"total resources",pageOfText:"Page",ofText:"of"},search:{headerTitle:"Search OER",keywordsLabel:"Keyword search",nameLabel:"Name",languageLabel:"Language",licenseLabel:"License",freeForUseLabel:"Free for use",descriptionLabel:"Description",typeLabel:"Resource type",keywordsPlaceholder:"Search by keyword...",namePlaceholder:"Resource name...",languagePlaceholder:"e.g., en, de, fr",licensePlaceholder:"License URI...",descriptionPlaceholder:"Search in descriptions...",typePlaceholder:"e.g., image, video, document",searchingText:"Searching...",searchButtonText:"Search",clearButtonText:"Clear",anyOptionText:"Any",yesOptionText:"Yes",noOptionText:"No",firstButtonText:"First",previousButtonText:"Previous",nextButtonText:"Next",lastButtonText:"Last",showingPagesText:"Showing",totalResourcesText:"total resources",pageOfText:"Page",advancedFiltersShowText:"Show advanced filters",advancedFiltersHideText:"Hide advanced filters",errorMessage:"An error occurred"}},de:{card:{noDataMessage:"Keine OER-Daten verfügbar",untitledMessage:"Unbenannte Ressource",licenseLabel:"Lizenz:",noLicenseMessage:"Keine Lizenzinformationen"},list:{loadingMessage:"Ressourcen werden geladen...",emptyTitle:"Keine Ressourcen gefunden",emptyMessage:"Passen Sie Ihre Suchkriterien an oder versuchen Sie es später erneut."},pagination:{firstButtonText:"Erste",previousButtonText:"Zurück",nextButtonText:"Weiter",lastButtonText:"Letzte",showingPagesText:"Angezeigt",totalResourcesText:"Ressourcen insgesamt",pageOfText:"Seite",ofText:"von"},search:{headerTitle:"OER suchen",keywordsLabel:"Stichwortsuche",nameLabel:"Name",languageLabel:"Sprache",licenseLabel:"Lizenz",freeForUseLabel:"Kostenlos verfügbar",descriptionLabel:"Beschreibung",typeLabel:"Ressourcentyp",keywordsPlaceholder:"Nach einem Stichwort suchen...",namePlaceholder:"Ressourcenname...",languagePlaceholder:"z.B. de, en, fr",licensePlaceholder:"Lizenz-URI...",descriptionPlaceholder:"In Beschreibungen suchen...",typePlaceholder:"z.B. image, video, document",searchingText:"Suche läuft...",searchButtonText:"Suchen",clearButtonText:"Zurücksetzen",anyOptionText:"Alle",yesOptionText:"Ja",noOptionText:"Nein",firstButtonText:"Erste",previousButtonText:"Zurück",nextButtonText:"Weiter",lastButtonText:"Letzte",showingPagesText:"Angezeigt",totalResourcesText:"Ressourcen insgesamt",pageOfText:"Seite",advancedFiltersShowText:"Erweiterte Filter anzeigen",advancedFiltersHideText:"Erweiterte Filter ausblenden",errorMessage:"Ein Fehler ist aufgetreten"}}};function K(n){return Me[n]||Me.en}function He(n){return K(n).card}function De(n){return K(n).list}function Ie(n){return K(n).search}function Fe(n){return K(n).pagination}const qe=[{uri:"https://creativecommons.org/publicdomain/zero/1.0/",shortName:"CC0 1.0"},{uri:"https://creativecommons.org/licenses/by/4.0/",shortName:"CC BY 4.0"},{uri:"https://creativecommons.org/licenses/by-sa/4.0/",shortName:"CC BY-SA 4.0"},{uri:"https://creativecommons.org/licenses/by-nd/4.0/",shortName:"CC BY-ND 4.0"},{uri:"https://creativecommons.org/licenses/by-nc/4.0/",shortName:"CC BY-NC 4.0"},{uri:"https://creativecommons.org/licenses/by-nc-sa/4.0/",shortName:"CC BY-NC-SA 4.0"},{uri:"https://creativecommons.org/licenses/by-nc-nd/4.0/",shortName:"CC BY-NC-ND 4.0"},{uri:"https://creativecommons.org/licenses/by/3.0/",shortName:"CC BY 3.0"},{uri:"https://creativecommons.org/licenses/by-sa/3.0/",shortName:"CC BY-SA 3.0"},{uri:"https://creativecommons.org/licenses/by-nd/3.0/",shortName:"CC BY-ND 3.0"},{uri:"https://creativecommons.org/licenses/by-nc/3.0/",shortName:"CC BY-NC 3.0"},{uri:"https://creativecommons.org/licenses/by-nc-sa/3.0/",shortName:"CC BY-NC-SA 3.0"},{uri:"https://creativecommons.org/licenses/by-nc-nd/3.0/",shortName:"CC BY-NC-ND 3.0"}];function At(n){const e=qe.find(t=>t.uri===n);return e?e.shortName:null}function te(n,e){return!n||n.length<=e?n:n.slice(0,e-3)+"..."}function We(n){return te(n,40)}function Ve(n){return te(n,60)}function Ye(n){return te(n,20)}function Ke(n){return n.slice(0,4).map(e=>{const t=typeof e=="string"?e:String(e);return Ye(t)})}const Ot=G`
  :host {
    display: block;
    width: 100%;
    box-sizing: border-box;
  }

  .card {
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
    background: var(--background-card);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition:
      box-shadow 0.3s ease,
      transform 0.3s ease;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .card:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .thumbnail-container {
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #f5f5f5;
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
    background: rgba(0, 0, 0, 0.05);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    color: var(--text-secondary);
  }

  .no-data {
    color: var(--text-muted);
    font-style: italic;
    font-size: 12px;
  }
`;var kt=Object.defineProperty,zt=Object.getOwnPropertyDescriptor,re=(n,e,t,i)=>{for(var r=i>1?void 0:i?zt(e,t):e,s=n.length-1,a;s>=0;s--)(a=n[s])&&(r=(i?a(e,t,r):a(r))||r);return i&&r&&kt(e,t,r),r};o.OerCardElement=class extends _{constructor(){super(...arguments),this.oer=null,this.onImageClick=null,this.language="en"}get t(){return He(this.language)}handleImageClick(){this.oer&&this.onImageClick&&this.onImageClick(this.oer)}getLicenseName(e){if(!e)return"Unknown License";const t=typeof e=="string"?e:JSON.stringify(e),i=At(t);return i||(t.includes("creativecommons.org")?"Creative Commons":"License")}render(){var p,u,c,d,m;if(!this.oer)return g`
        <div class="card">
          <div class="content">
            <p class="no-data">${this.t.noDataMessage}</p>
          </div>
        </div>
      `;const e=(p=this.oer.amb_metadata)==null?void 0:p.image,t=We(((u=this.oer.amb_metadata)==null?void 0:u.name)||this.t.untitledMessage),i=((c=this.oer.amb_metadata)==null?void 0:c.description)||this.oer.amb_description,r=typeof i=="string"?i:"",s=r?Ve(r):"",a=this.oer.amb_keywords||((d=this.oer.amb_metadata)==null?void 0:d.keywords)||[],l=Ke(a),h=this.oer.amb_license_uri||((m=this.oer.amb_metadata)==null?void 0:m.license);return g`
      <div class="card">
        <div class="thumbnail-container" @click="${this.handleImageClick}">
          ${e?g`<img
                class="thumbnail"
                src="${e}"
                alt="${this.oer.file_alt||t}"
                loading="lazy"
              />`:g`<div class="placeholder">📚</div>`}
        </div>
        <div class="content">
          <h3 class="title">${t}</h3>
          ${s?g`<p class="description">${s}</p>`:""}
          <div class="metadata">
            <div class="license">
              ${h?g`${this.t.licenseLabel}
                    <a
                      href="${typeof h=="string"?h:String(h)}"
                      target="_blank"
                      rel="noopener noreferrer"
                      >${this.getLicenseName(h)}</a
                    >`:g`<span class="no-data">${this.t.noLicenseMessage}</span>`}
            </div>
            ${l&&l.length>0?g`
                  <div class="keywords">
                    ${l.map(E=>g`<span class="keyword">${E}</span>`)}
                  </div>
                `:""}
          </div>
        </div>
      </div>
    `}},o.OerCardElement.styles=Ot,re([f({type:Object})],o.OerCardElement.prototype,"oer",2),re([f({type:Function})],o.OerCardElement.prototype,"onImageClick",2),re([f({type:String})],o.OerCardElement.prototype,"language",2),o.OerCardElement=re([V("oer-card")],o.OerCardElement);const Rt=G`
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
    border: 1px solid rgba(0, 0, 0, 0.1);
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
    background: rgba(0, 0, 0, 0.05);
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
    background: rgba(0, 0, 0, 0.1);
  }

  .page-button:disabled {
    background: rgba(0, 0, 0, 0.05);
    color: rgba(0, 0, 0, 0.3);
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
`;var Lt=Object.defineProperty,Nt=Object.getOwnPropertyDescriptor,J=(n,e,t,i)=>{for(var r=i>1?void 0:i?Nt(e,t):e,s=n.length-1,a;s>=0;s--)(a=n[s])&&(r=(i?a(e,t,r):a(r))||r);return i&&r&&Lt(e,t,r),r};o.PaginationElement=class extends _{constructor(){super(...arguments),this.metadata=null,this.loading=!1,this.onPageChange=null,this.language="en"}get t(){return Fe(this.language)}render(){return this.metadata?g`
      <div class="pagination">
        <div class="pagination-info">
          ${this.t.showingPagesText} ${this.t.pageOfText.toLowerCase()} ${this.metadata.page}
          ${this.t.ofText} ${this.metadata.totalPages} (${this.metadata.total}
          ${this.t.totalResourcesText})
        </div>
        <div class="pagination-controls">
          <button
            class="page-button"
            ?disabled="${this.metadata.page===1||this.loading}"
            @click="${()=>this.handlePageChange(1)}"
          >
            ${this.t.firstButtonText}
          </button>
          <button
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
            class="page-button"
            ?disabled="${this.metadata.page===this.metadata.totalPages||this.loading}"
            @click="${()=>this.handlePageChange(this.metadata.page+1)}"
          >
            ${this.t.nextButtonText}
          </button>
          <button
            class="page-button"
            ?disabled="${this.metadata.page===this.metadata.totalPages||this.loading}"
            @click="${()=>this.handlePageChange(this.metadata.totalPages)}"
          >
            ${this.t.lastButtonText}
          </button>
        </div>
      </div>
    `:""}handlePageChange(e){this.onPageChange&&this.onPageChange(e)}},o.PaginationElement.styles=Rt,J([f({type:Object})],o.PaginationElement.prototype,"metadata",2),J([f({type:Boolean})],o.PaginationElement.prototype,"loading",2),J([f({type:Function})],o.PaginationElement.prototype,"onPageChange",2),J([f({type:String})],o.PaginationElement.prototype,"language",2),o.PaginationElement=J([V("oer-pagination")],o.PaginationElement);const Ut=G`
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
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
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
    border: 4px solid #f3f3f3;
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
    color: #d32f2f;
  }

  .error-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .error-message {
    font-size: 14px;
    margin: 0;
  }
`;var jt=Object.defineProperty,Bt=Object.getOwnPropertyDescriptor,w=(n,e,t,i)=>{for(var r=i>1?void 0:i?Bt(e,t):e,s=n.length-1,a;s>=0;s--)(a=n[s])&&(r=(i?a(e,t,r):a(r))||r);return i&&r&&jt(e,t,r),r};o.OerListElement=class extends _{constructor(){super(...arguments),this.oers=[],this.loading=!1,this.error=null,this.onCardClick=null,this.language="en",this.showPagination=!1,this.metadata=null,this.onPageChange=null}get t(){return De(this.language)}render(){return this.loading?g`
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
          ${this.oers.map(e=>g`
              <oer-card
                .oer="${e}"
                .onImageClick="${this.onCardClick}"
                .language="${this.language}"
              ></oer-card>
            `)}
        </div>
      </div>
      ${this.showPagination&&this.metadata?g`
            <oer-pagination
              .metadata="${this.metadata}"
              .loading="${this.loading}"
              .onPageChange="${this.onPageChange}"
              .language="${this.language}"
            ></oer-pagination>
          `:""}
    `}},o.OerListElement.styles=Ut,w([f({type:Array})],o.OerListElement.prototype,"oers",2),w([f({type:Boolean})],o.OerListElement.prototype,"loading",2),w([f({type:String})],o.OerListElement.prototype,"error",2),w([f({type:Function})],o.OerListElement.prototype,"onCardClick",2),w([f({type:String})],o.OerListElement.prototype,"language",2),w([f({type:Boolean})],o.OerListElement.prototype,"showPagination",2),w([f({type:Object})],o.OerListElement.prototype,"metadata",2),w([f({type:Function})],o.OerListElement.prototype,"onPageChange",2),o.OerListElement=w([V("oer-list")],o.OerListElement);const Mt=/\{[^{}]+\}/g,Ht=()=>{var n,e;return typeof process=="object"&&Number.parseInt((e=(n=process==null?void 0:process.versions)==null?void 0:n.node)==null?void 0:e.substring(0,2))>=18&&process.versions.undici};function Dt(){return Math.random().toString(36).slice(2,11)}function It(n){let{baseUrl:e="",Request:t=globalThis.Request,fetch:i=globalThis.fetch,querySerializer:r,bodySerializer:s,headers:a,requestInitExt:l=void 0,...h}={...n};l=Ht()?l:void 0,e=Xe(e);const p=[];async function u(c,d){const{baseUrl:m,fetch:E=i,Request:ir=t,headers:st,params:B={},parseAs:be="json",querySerializer:ne,bodySerializer:at=s??qt,body:ot,...$e}=d||{};let xe=e;m&&(xe=Xe(m)??e);let ve=typeof r=="function"?r:Ge(r);ne&&(ve=typeof ne=="function"?ne:Ge({...typeof r=="object"?r:{},...ne}));const _e=ot===void 0?void 0:at(ot,Qe(a,st,B.header)),er=Qe(_e===void 0||_e instanceof FormData?{}:{"Content-Type":"application/json"},a,st,B.header),tr={redirect:"follow",...h,...$e,body:_e,headers:er};let se,ae,T=new t(Wt(c,{baseUrl:xe,params:B,querySerializer:ve}),tr),b;for(const x in $e)x in T||(T[x]=$e[x]);if(p.length){se=Dt(),ae=Object.freeze({baseUrl:xe,fetch:E,parseAs:be,querySerializer:ve,bodySerializer:at});for(const x of p)if(x&&typeof x=="object"&&typeof x.onRequest=="function"){const $=await x.onRequest({request:T,schemaPath:c,params:B,options:ae,id:se});if($)if($ instanceof t)T=$;else if($ instanceof Response){b=$;break}else throw new Error("onRequest: must return new Request() or Response() when modifying the request")}}if(!b){try{b=await E(T,l)}catch(x){let $=x;if(p.length)for(let R=p.length-1;R>=0;R--){const oe=p[R];if(oe&&typeof oe=="object"&&typeof oe.onError=="function"){const Z=await oe.onError({request:T,error:$,schemaPath:c,params:B,options:ae,id:se});if(Z){if(Z instanceof Response){$=void 0,b=Z;break}if(Z instanceof Error){$=Z;continue}throw new Error("onError: must return new Response() or instance of Error")}}}if($)throw $}if(p.length)for(let x=p.length-1;x>=0;x--){const $=p[x];if($&&typeof $=="object"&&typeof $.onResponse=="function"){const R=await $.onResponse({request:T,response:b,schemaPath:c,params:B,options:ae,id:se});if(R){if(!(R instanceof Response))throw new Error("onResponse: must return new Response() when modifying the response");b=R}}}}if(b.status===204||T.method==="HEAD"||b.headers.get("Content-Length")==="0")return b.ok?{data:void 0,response:b}:{error:void 0,response:b};if(b.ok)return be==="stream"?{data:b.body,response:b}:{data:await b[be](),response:b};let we=await b.text();try{we=JSON.parse(we)}catch{}return{error:we,response:b}}return{request(c,d,m){return u(d,{...m,method:c.toUpperCase()})},GET(c,d){return u(c,{...d,method:"GET"})},PUT(c,d){return u(c,{...d,method:"PUT"})},POST(c,d){return u(c,{...d,method:"POST"})},DELETE(c,d){return u(c,{...d,method:"DELETE"})},OPTIONS(c,d){return u(c,{...d,method:"OPTIONS"})},HEAD(c,d){return u(c,{...d,method:"HEAD"})},PATCH(c,d){return u(c,{...d,method:"PATCH"})},TRACE(c,d){return u(c,{...d,method:"TRACE"})},use(...c){for(const d of c)if(d){if(typeof d!="object"||!("onRequest"in d||"onResponse"in d||"onError"in d))throw new Error("Middleware must be an object with one of `onRequest()`, `onResponse() or `onError()`");p.push(d)}},eject(...c){for(const d of c){const m=p.indexOf(d);m!==-1&&p.splice(m,1)}}}}function ie(n,e,t){if(e==null)return"";if(typeof e=="object")throw new Error("Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these.");return`${n}=${(t==null?void 0:t.allowReserved)===!0?e:encodeURIComponent(e)}`}function Je(n,e,t){if(!e||typeof e!="object")return"";const i=[],r={simple:",",label:".",matrix:";"}[t.style]||"&";if(t.style!=="deepObject"&&t.explode===!1){for(const l in e)i.push(l,t.allowReserved===!0?e[l]:encodeURIComponent(e[l]));const a=i.join(",");switch(t.style){case"form":return`${n}=${a}`;case"label":return`.${a}`;case"matrix":return`;${n}=${a}`;default:return a}}for(const a in e){const l=t.style==="deepObject"?`${n}[${a}]`:a;i.push(ie(l,e[a],t))}const s=i.join(r);return t.style==="label"||t.style==="matrix"?`${r}${s}`:s}function Ze(n,e,t){if(!Array.isArray(e))return"";if(t.explode===!1){const s={form:",",spaceDelimited:"%20",pipeDelimited:"|"}[t.style]||",",a=(t.allowReserved===!0?e:e.map(l=>encodeURIComponent(l))).join(s);switch(t.style){case"simple":return a;case"label":return`.${a}`;case"matrix":return`;${n}=${a}`;default:return`${n}=${a}`}}const i={simple:",",label:".",matrix:";"}[t.style]||"&",r=[];for(const s of e)t.style==="simple"||t.style==="label"?r.push(t.allowReserved===!0?s:encodeURIComponent(s)):r.push(ie(n,s,t));return t.style==="label"||t.style==="matrix"?`${i}${r.join(i)}`:r.join(i)}function Ge(n){return function(t){const i=[];if(t&&typeof t=="object")for(const r in t){const s=t[r];if(s!=null){if(Array.isArray(s)){if(s.length===0)continue;i.push(Ze(r,s,{style:"form",explode:!0,...n==null?void 0:n.array,allowReserved:(n==null?void 0:n.allowReserved)||!1}));continue}if(typeof s=="object"){i.push(Je(r,s,{style:"deepObject",explode:!0,...n==null?void 0:n.object,allowReserved:(n==null?void 0:n.allowReserved)||!1}));continue}i.push(ie(r,s,n))}}return i.join("&")}}function Ft(n,e){let t=n;for(const i of n.match(Mt)??[]){let r=i.substring(1,i.length-1),s=!1,a="simple";if(r.endsWith("*")&&(s=!0,r=r.substring(0,r.length-1)),r.startsWith(".")?(a="label",r=r.substring(1)):r.startsWith(";")&&(a="matrix",r=r.substring(1)),!e||e[r]===void 0||e[r]===null)continue;const l=e[r];if(Array.isArray(l)){t=t.replace(i,Ze(r,l,{style:a,explode:s}));continue}if(typeof l=="object"){t=t.replace(i,Je(r,l,{style:a,explode:s}));continue}if(a==="matrix"){t=t.replace(i,`;${ie(r,l)}`);continue}t=t.replace(i,a==="label"?`.${encodeURIComponent(l)}`:encodeURIComponent(l))}return t}function qt(n,e){return n instanceof FormData?n:e&&(e.get instanceof Function?e.get("Content-Type")??e.get("content-type"):e["Content-Type"]??e["content-type"])==="application/x-www-form-urlencoded"?new URLSearchParams(n).toString():JSON.stringify(n)}function Wt(n,e){var r;let t=`${e.baseUrl}${n}`;(r=e.params)!=null&&r.path&&(t=Ft(t,e.params.path));let i=e.querySerializer(e.params.query??{});return i.startsWith("?")&&(i=i.substring(1)),i&&(t+=`?${i}`),t}function Qe(...n){const e=new Headers;for(const t of n){if(!t||typeof t!="object")continue;const i=t instanceof Headers?t.entries():Object.entries(t);for(const[r,s]of i)if(s===null)e.delete(r);else if(Array.isArray(s))for(const a of s)e.append(r,a);else s!==void 0&&e.set(r,s)}return e}function Xe(n){return n.endsWith("/")?n.substring(0,n.length-1):n}function et(n,e){return It({baseUrl:n.replace(/\/$/,""),headers:e==null?void 0:e.headers,fetch:e==null?void 0:e.fetch})}const Vt=G`
  :host {
    display: block;
    width: 100%;
    box-sizing: border-box;
  }

  .search-container {
    background: var(--background-form);
    border: 1px solid rgba(0, 0, 0, 0.1);
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
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.2s ease;
    box-sizing: border-box;
    background: white;
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
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-secondary);
    flex: 0 0 auto;
  }

  .clear-button:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: var(--background-form);
    border: 1px solid rgba(0, 0, 0, 0.1);
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
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary);
    min-width: 40px;
    flex-shrink: 0;
  }

  .page-button:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.1);
  }

  .page-button:disabled {
    background: rgba(0, 0, 0, 0.05);
    color: rgba(0, 0, 0, 0.3);
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
`;var Yt=Object.defineProperty,Kt=Object.getOwnPropertyDescriptor,v=(n,e,t,i)=>{for(var r=i>1?void 0:i?Kt(e,t):e,s=n.length-1,a;s>=0;s--)(a=n[s])&&(r=(i?a(e,t,r):a(r))||r);return i&&r&&Yt(e,t,r),r};o.OerSearchElement=class extends _{constructor(){super(...arguments),this.apiUrl="http://localhost:3000",this.language="en",this.showTypeFilter=!0,this.pageSize=20,this.client=null,this.searchParams={page:1},this.loading=!1,this.error=null,this.advancedFiltersExpanded=!1}get t(){return Ie(this.language)}connectedCallback(){super.connectedCallback(),this.client=et(this.apiUrl),this.searchParams={...this.searchParams,pageSize:this.pageSize},this.lockedType&&(this.searchParams={...this.searchParams,type:this.lockedType})}async performSearch(){if(this.client){this.loading=!0,this.error=null;try{const e=await this.client.GET("/api/v1/oer",{params:{query:this.searchParams}});if(e.error){const t=e.error.message?Array.isArray(e.error.message)?e.error.message.join(", "):e.error.message:"Failed to fetch resources";throw new Error(t)}e.data&&this.dispatchEvent(new CustomEvent("search-results",{detail:{data:e.data.data,meta:e.data.meta},bubbles:!0,composed:!0}))}catch(e){this.error=e instanceof Error?e.message:this.t.errorMessage,this.dispatchEvent(new CustomEvent("search-error",{detail:{error:this.error},bubbles:!0,composed:!0}))}finally{this.loading=!1}}}handleSubmit(e){e.preventDefault(),this.searchParams={...this.searchParams,page:1},this.performSearch()}handleClear(){this.searchParams={page:1,pageSize:this.pageSize},this.lockedType&&(this.searchParams={...this.searchParams,type:this.lockedType}),this.error=null,this.dispatchEvent(new CustomEvent("search-cleared",{bubbles:!0,composed:!0}))}handleInputChange(e){return t=>{const r=t.target.value.trim();if(r===""){const{[e]:s,...a}=this.searchParams;this.searchParams=a}else this.searchParams={...this.searchParams,[e]:r}}}handleBooleanChange(e){return t=>{const r=t.target.value;if(r===""){const{[e]:s,...a}=this.searchParams;this.searchParams=a}else this.searchParams={...this.searchParams,[e]:r==="true"}}}toggleAdvancedFilters(){this.advancedFiltersExpanded=!this.advancedFiltersExpanded}handlePageChange(e){this.searchParams={...this.searchParams,page:e},this.performSearch()}render(){return g`
      <div class="search-container">
        <h2 class="search-header">${this.t.headerTitle}</h2>
        <form class="search-form" @submit="${this.handleSubmit}">
          <div class="form-group">
            <label for="keywords">${this.t.keywordsLabel}</label>
            <input
              id="keywords"
              type="text"
              placeholder="${this.t.keywordsPlaceholder}"
              .value="${this.searchParams.keywords||""}"
              @input="${this.handleInputChange("keywords")}"
            />
          </div>

          ${this.showTypeFilter&&!this.lockedType?g`
                <div class="form-group">
                  <label for="type">${this.t.typeLabel}</label>
                  <input
                    id="type"
                    type="text"
                    placeholder="${this.t.typePlaceholder}"
                    .value="${this.searchParams.type||""}"
                    @input="${this.handleInputChange("type")}"
                  />
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
                <label for="name">${this.t.nameLabel}</label>
                <input
                  id="name"
                  type="text"
                  placeholder="${this.t.namePlaceholder}"
                  .value="${this.searchParams.name||""}"
                  @input="${this.handleInputChange("name")}"
                />
              </div>

              <div class="form-group">
                <label for="language">${this.t.languageLabel}</label>
                <input
                  id="language"
                  type="text"
                  placeholder="${this.t.languagePlaceholder}"
                  maxlength="3"
                  .value="${this.searchParams.language||""}"
                  @input="${this.handleInputChange("language")}"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="license">${this.t.licenseLabel}</label>
                <select
                  id="license"
                  .value="${this.searchParams.license||""}"
                  @change="${this.handleInputChange("license")}"
                >
                  <option value="">${this.t.anyOptionText}</option>
                  ${qe.map(e=>g`
                      <option value="${e.uri}">${e.shortName}</option>
                    `)}
                </select>
              </div>

              <div class="form-group">
                <label for="free_for_use">${this.t.freeForUseLabel}</label>
                <select
                  id="free_for_use"
                  .value="${this.searchParams.free_for_use===void 0?"":String(this.searchParams.free_for_use)}"
                  @change="${this.handleBooleanChange("free_for_use")}"
                >
                  <option value="">${this.t.anyOptionText}</option>
                  <option value="true">${this.t.yesOptionText}</option>
                  <option value="false">${this.t.noOptionText}</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="description">${this.t.descriptionLabel}</label>
              <input
                id="description"
                type="text"
                placeholder="${this.t.descriptionPlaceholder}"
                .value="${this.searchParams.description||""}"
                @input="${this.handleInputChange("description")}"
              />
            </div>
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
    `}},o.OerSearchElement.styles=Vt,v([f({type:String,attribute:"api-url"})],o.OerSearchElement.prototype,"apiUrl",2),v([f({type:String})],o.OerSearchElement.prototype,"language",2),v([f({type:String,attribute:"locked-type"})],o.OerSearchElement.prototype,"lockedType",2),v([f({type:Boolean,attribute:"show-type-filter"})],o.OerSearchElement.prototype,"showTypeFilter",2),v([f({type:Number,attribute:"page-size"})],o.OerSearchElement.prototype,"pageSize",2),v([Y()],o.OerSearchElement.prototype,"client",2),v([Y()],o.OerSearchElement.prototype,"searchParams",2),v([Y()],o.OerSearchElement.prototype,"loading",2),v([Y()],o.OerSearchElement.prototype,"error",2),v([Y()],o.OerSearchElement.prototype,"advancedFiltersExpanded",2),o.OerSearchElement=v([V("oer-search")],o.OerSearchElement);const j={name:"default",colors:{primary:"#667eea",primaryHover:"#5568d3",secondary:"#764ba2",background:{page:"#ffffff",card:"#ffffff",form:"#f8f9fa"},text:{primary:"#2d3748",secondary:"#4a5568",muted:"#718096"}}},tt={name:"dark",colors:{primary:"#7c3aed",primaryHover:"#6d28d9",secondary:"#8b5cf6",background:{page:"#1a202c",card:"#2d3748",form:"#374151"},text:{primary:"#f7fafc",secondary:"#e2e8f0",muted:"#a0aec0"}}},me={default:j,dark:tt};function rt(n){return me[n]||j}function ye(n){return typeof n=="string"&&n in me}var Jt=Object.defineProperty,Zt=Object.getOwnPropertyDescriptor,it=(n,e,t,i)=>{for(var r=i>1?void 0:i?Zt(e,t):e,s=n.length-1,a;s>=0;s--)(a=n[s])&&(r=(i?a(e,t,r):a(r))||r);return i&&r&&Jt(e,t,r),r};o.OerThemeProvider=class extends _{constructor(){super(...arguments),this._theme=j}set theme(e){const t=this._theme;ye(e)?this._theme=rt(e):typeof e=="object"&&e!==null&&"colors"in e?this._theme=e:this._theme=j,this.requestUpdate("theme",t)}get theme(){return this._theme}updated(e){e.has("theme")&&(this.style.setProperty("--primary-color",this._theme.colors.primary),this.style.setProperty("--primary-hover-color",this._theme.colors.primaryHover),this.style.setProperty("--secondary-color",this._theme.colors.secondary),this.style.setProperty("--background-card",this._theme.colors.background.card),this.style.setProperty("--background-form",this._theme.colors.background.form),this.style.setProperty("--text-primary",this._theme.colors.text.primary),this.style.setProperty("--text-secondary",this._theme.colors.text.secondary),this.style.setProperty("--text-muted",this._theme.colors.text.muted))}render(){return g`<slot></slot>`}},it([f({converter:{fromAttribute:n=>n?ye(n)?n:(console.warn(`Invalid theme name "${n}". Falling back to "default". Valid theme names: 'default', 'dark'`),"default"):"default",toAttribute:n=>typeof n=="string"?n:n.name}})],o.OerThemeProvider.prototype,"theme",1),o.OerThemeProvider=it([V("oer-theme-provider")],o.OerThemeProvider);/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function rr(n){return n}const Gt="oer-theme",Qt=j,Xt="0.0.1";o.VERSION=Xt,o.createOerClient=et,o.darkTheme=tt,o.defaultTheme=j,o.defaultThemeValue=Qt,o.getCardTranslations=He,o.getListTranslations=De,o.getPaginationTranslations=Fe,o.getSearchTranslations=Ie,o.getTheme=rt,o.getTranslations=K,o.isThemeName=ye,o.shortenLabels=Ke,o.themeContext=Gt,o.themes=me,o.truncateContent=Ve,o.truncateLabel=Ye,o.truncateText=te,o.truncateTitle=We,Object.defineProperty(o,Symbol.toStringTag,{value:"Module"})}));
