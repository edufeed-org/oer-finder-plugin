/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const re = globalThis, ve = re.ShadowRoot && (re.ShadyCSS === void 0 || re.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, _e = Symbol(), Ee = /* @__PURE__ */ new WeakMap();
let qe = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== _e) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (ve && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = Ee.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && Ee.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const st = (r) => new qe(typeof r == "string" ? r : r + "", void 0, _e), ne = (r, ...e) => {
  const t = r.length === 1 ? r[0] : e.reduce(((i, s, n) => i + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + r[n + 1]), r[0]);
  return new qe(t, r, _e);
}, it = (r, e) => {
  if (ve) r.adoptedStyleSheets = e.map(((t) => t instanceof CSSStyleSheet ? t : t.styleSheet));
  else for (const t of e) {
    const i = document.createElement("style"), s = re.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = t.cssText, r.appendChild(i);
  }
}, Oe = ve ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return st(t);
})(r) : r;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: nt, defineProperty: ot, getOwnPropertyDescriptor: at, getOwnPropertyNames: lt, getOwnPropertySymbols: ct, getPrototypeOf: ht } = Object, S = globalThis, ke = S.trustedTypes, dt = ke ? ke.emptyScript : "", me = S.reactiveElementPolyfillSupport, I = (r, e) => r, se = { toAttribute(r, e) {
  switch (e) {
    case Boolean:
      r = r ? dt : null;
      break;
    case Object:
    case Array:
      r = r == null ? r : JSON.stringify(r);
  }
  return r;
}, fromAttribute(r, e) {
  let t = r;
  switch (e) {
    case Boolean:
      t = r !== null;
      break;
    case Number:
      t = r === null ? null : Number(r);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(r);
      } catch {
        t = null;
      }
  }
  return t;
} }, we = (r, e) => !nt(r, e), ze = { attribute: !0, type: String, converter: se, reflect: !1, useDefault: !1, hasChanged: we };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), S.litPropertyMetadata ?? (S.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let L = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = ze) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = Symbol(), s = this.getPropertyDescriptor(e, i, t);
      s !== void 0 && ot(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: s, set: n } = at(this.prototype, e) ?? { get() {
      return this[t];
    }, set(o) {
      this[t] = o;
    } };
    return { get: s, set(o) {
      const a = s == null ? void 0 : s.call(this);
      n == null || n.call(this, o), this.requestUpdate(e, a, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? ze;
  }
  static _$Ei() {
    if (this.hasOwnProperty(I("elementProperties"))) return;
    const e = ht(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(I("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(I("properties"))) {
      const t = this.properties, i = [...lt(t), ...ct(t)];
      for (const s of i) this.createProperty(s, t[s]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [i, s] of t) this.elementProperties.set(i, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, i] of this.elementProperties) {
      const s = this._$Eu(t, i);
      s !== void 0 && this._$Eh.set(s, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const s of i) t.unshift(Oe(s));
    } else e !== void 0 && t.push(Oe(e));
    return t;
  }
  static _$Eu(e, t) {
    const i = t.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var e;
    this._$ES = new Promise(((t) => this.enableUpdating = t)), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (e = this.constructor.l) == null || e.forEach(((t) => t(this)));
  }
  addController(e) {
    var t;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(e), this.renderRoot !== void 0 && this.isConnected && ((t = e.hostConnected) == null || t.call(e));
  }
  removeController(e) {
    var t;
    (t = this._$EO) == null || t.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const i of t.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return it(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach(((t) => {
      var i;
      return (i = t.hostConnected) == null ? void 0 : i.call(t);
    }));
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach(((t) => {
      var i;
      return (i = t.hostDisconnected) == null ? void 0 : i.call(t);
    }));
  }
  attributeChangedCallback(e, t, i) {
    this._$AK(e, i);
  }
  _$ET(e, t) {
    var n;
    const i = this.constructor.elementProperties.get(e), s = this.constructor._$Eu(e, i);
    if (s !== void 0 && i.reflect === !0) {
      const o = (((n = i.converter) == null ? void 0 : n.toAttribute) !== void 0 ? i.converter : se).toAttribute(t, i.type);
      this._$Em = e, o == null ? this.removeAttribute(s) : this.setAttribute(s, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var n, o;
    const i = this.constructor, s = i._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const a = i.getPropertyOptions(s), c = typeof a.converter == "function" ? { fromAttribute: a.converter } : ((n = a.converter) == null ? void 0 : n.fromAttribute) !== void 0 ? a.converter : se;
      this._$Em = s;
      const d = c.fromAttribute(t, a.type);
      this[s] = d ?? ((o = this._$Ej) == null ? void 0 : o.get(s)) ?? d, this._$Em = null;
    }
  }
  requestUpdate(e, t, i) {
    var s;
    if (e !== void 0) {
      const n = this.constructor, o = this[e];
      if (i ?? (i = n.getPropertyOptions(e)), !((i.hasChanged ?? we)(o, t) || i.useDefault && i.reflect && o === ((s = this._$Ej) == null ? void 0 : s.get(e)) && !this.hasAttribute(n._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: s, wrapped: n }, o) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, o ?? t ?? this[e]), n !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), s === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var i;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [n, o] of this._$Ep) this[n] = o;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [n, o] of s) {
        const { wrapped: a } = o, c = this[n];
        a !== !0 || this._$AL.has(n) || c === void 0 || this.C(n, void 0, o, c);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (i = this._$EO) == null || i.forEach(((s) => {
        var n;
        return (n = s.hostUpdate) == null ? void 0 : n.call(s);
      })), this.update(t)) : this._$EM();
    } catch (s) {
      throw e = !1, this._$EM(), s;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach(((i) => {
      var s;
      return (s = i.hostUpdated) == null ? void 0 : s.call(i);
    })), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq && (this._$Eq = this._$Eq.forEach(((t) => this._$ET(t, this[t])))), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
L.elementStyles = [], L.shadowRootOptions = { mode: "open" }, L[I("elementProperties")] = /* @__PURE__ */ new Map(), L[I("finalized")] = /* @__PURE__ */ new Map(), me == null || me({ ReactiveElement: L }), (S.reactiveElementVersions ?? (S.reactiveElementVersions = [])).push("2.1.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const F = globalThis, ie = F.trustedTypes, Re = ie ? ie.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, We = "$lit$", C = `lit$${Math.random().toFixed(9).slice(2)}$`, Ye = "?" + C, pt = `<${Ye}>`, R = document, q = () => R.createComment(""), W = (r) => r === null || typeof r != "object" && typeof r != "function", Pe = Array.isArray, ut = (r) => Pe(r) || typeof (r == null ? void 0 : r[Symbol.iterator]) == "function", ye = `[ 	
\f\r]`, D = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ne = /-->/g, Ue = />/g, O = RegExp(`>|${ye}(?:([^\\s"'>=/]+)(${ye}*=${ye}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Le = /'/g, je = /"/g, Ve = /^(?:script|style|textarea|title)$/i, ft = (r) => (e, ...t) => ({ _$litType$: r, strings: e, values: t }), f = ft(1), j = Symbol.for("lit-noChange"), y = Symbol.for("lit-nothing"), Be = /* @__PURE__ */ new WeakMap(), k = R.createTreeWalker(R, 129);
function Ke(r, e) {
  if (!Pe(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Re !== void 0 ? Re.createHTML(e) : e;
}
const gt = (r, e) => {
  const t = r.length - 1, i = [];
  let s, n = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = D;
  for (let a = 0; a < t; a++) {
    const c = r[a];
    let d, p, l = -1, h = 0;
    for (; h < c.length && (o.lastIndex = h, p = o.exec(c), p !== null); ) h = o.lastIndex, o === D ? p[1] === "!--" ? o = Ne : p[1] !== void 0 ? o = Ue : p[2] !== void 0 ? (Ve.test(p[2]) && (s = RegExp("</" + p[2], "g")), o = O) : p[3] !== void 0 && (o = O) : o === O ? p[0] === ">" ? (o = s ?? D, l = -1) : p[1] === void 0 ? l = -2 : (l = o.lastIndex - p[2].length, d = p[1], o = p[3] === void 0 ? O : p[3] === '"' ? je : Le) : o === je || o === Le ? o = O : o === Ne || o === Ue ? o = D : (o = O, s = void 0);
    const g = o === O && r[a + 1].startsWith("/>") ? " " : "";
    n += o === D ? c + pt : l >= 0 ? (i.push(d), c.slice(0, l) + We + c.slice(l) + C + g) : c + C + (l === -2 ? a : g);
  }
  return [Ke(r, n + (r[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class Y {
  constructor({ strings: e, _$litType$: t }, i) {
    let s;
    this.parts = [];
    let n = 0, o = 0;
    const a = e.length - 1, c = this.parts, [d, p] = gt(e, t);
    if (this.el = Y.createElement(d, i), k.currentNode = this.el.content, t === 2 || t === 3) {
      const l = this.el.content.firstChild;
      l.replaceWith(...l.childNodes);
    }
    for (; (s = k.nextNode()) !== null && c.length < a; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const l of s.getAttributeNames()) if (l.endsWith(We)) {
          const h = p[o++], g = s.getAttribute(l).split(C), T = /([.?@])?(.*)/.exec(h);
          c.push({ type: 1, index: n, name: T[2], strings: g, ctor: T[1] === "." ? yt : T[1] === "?" ? bt : T[1] === "@" ? xt : oe }), s.removeAttribute(l);
        } else l.startsWith(C) && (c.push({ type: 6, index: n }), s.removeAttribute(l));
        if (Ve.test(s.tagName)) {
          const l = s.textContent.split(C), h = l.length - 1;
          if (h > 0) {
            s.textContent = ie ? ie.emptyScript : "";
            for (let g = 0; g < h; g++) s.append(l[g], q()), k.nextNode(), c.push({ type: 2, index: ++n });
            s.append(l[h], q());
          }
        }
      } else if (s.nodeType === 8) if (s.data === Ye) c.push({ type: 2, index: n });
      else {
        let l = -1;
        for (; (l = s.data.indexOf(C, l + 1)) !== -1; ) c.push({ type: 7, index: n }), l += C.length - 1;
      }
      n++;
    }
  }
  static createElement(e, t) {
    const i = R.createElement("template");
    return i.innerHTML = e, i;
  }
}
function B(r, e, t = r, i) {
  var o, a;
  if (e === j) return e;
  let s = i !== void 0 ? (o = t._$Co) == null ? void 0 : o[i] : t._$Cl;
  const n = W(e) ? void 0 : e._$litDirective$;
  return (s == null ? void 0 : s.constructor) !== n && ((a = s == null ? void 0 : s._$AO) == null || a.call(s, !1), n === void 0 ? s = void 0 : (s = new n(r), s._$AT(r, t, i)), i !== void 0 ? (t._$Co ?? (t._$Co = []))[i] = s : t._$Cl = s), s !== void 0 && (e = B(r, s._$AS(r, e.values), s, i)), e;
}
class mt {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: i } = this._$AD, s = ((e == null ? void 0 : e.creationScope) ?? R).importNode(t, !0);
    k.currentNode = s;
    let n = k.nextNode(), o = 0, a = 0, c = i[0];
    for (; c !== void 0; ) {
      if (o === c.index) {
        let d;
        c.type === 2 ? d = new K(n, n.nextSibling, this, e) : c.type === 1 ? d = new c.ctor(n, c.name, c.strings, this, e) : c.type === 6 && (d = new $t(n, this, e)), this._$AV.push(d), c = i[++a];
      }
      o !== (c == null ? void 0 : c.index) && (n = k.nextNode(), o++);
    }
    return k.currentNode = R, s;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class K {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, i, s) {
    this.type = 2, this._$AH = y, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = s, this._$Cv = (s == null ? void 0 : s.isConnected) ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && (e == null ? void 0 : e.nodeType) === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = B(this, e, t), W(e) ? e === y || e == null || e === "" ? (this._$AH !== y && this._$AR(), this._$AH = y) : e !== this._$AH && e !== j && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : ut(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== y && W(this._$AH) ? this._$AA.nextSibling.data = e : this.T(R.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var n;
    const { values: t, _$litType$: i } = e, s = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = Y.createElement(Ke(i.h, i.h[0]), this.options)), i);
    if (((n = this._$AH) == null ? void 0 : n._$AD) === s) this._$AH.p(t);
    else {
      const o = new mt(s, this), a = o.u(this.options);
      o.p(t), this.T(a), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = Be.get(e.strings);
    return t === void 0 && Be.set(e.strings, t = new Y(e)), t;
  }
  k(e) {
    Pe(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, s = 0;
    for (const n of e) s === t.length ? t.push(i = new K(this.O(q()), this.O(q()), this, this.options)) : i = t[s], i._$AI(n), s++;
    s < t.length && (this._$AR(i && i._$AB.nextSibling, s), t.length = s);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, t); e !== this._$AB; ) {
      const s = e.nextSibling;
      e.remove(), e = s;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class oe {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, s, n) {
    this.type = 1, this._$AH = y, this._$AN = void 0, this.element = e, this.name = t, this._$AM = s, this.options = n, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = y;
  }
  _$AI(e, t = this, i, s) {
    const n = this.strings;
    let o = !1;
    if (n === void 0) e = B(this, e, t, 0), o = !W(e) || e !== this._$AH && e !== j, o && (this._$AH = e);
    else {
      const a = e;
      let c, d;
      for (e = n[0], c = 0; c < n.length - 1; c++) d = B(this, a[i + c], t, c), d === j && (d = this._$AH[c]), o || (o = !W(d) || d !== this._$AH[c]), d === y ? e = y : e !== y && (e += (d ?? "") + n[c + 1]), this._$AH[c] = d;
    }
    o && !s && this.j(e);
  }
  j(e) {
    e === y ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class yt extends oe {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === y ? void 0 : e;
  }
}
class bt extends oe {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== y);
  }
}
class xt extends oe {
  constructor(e, t, i, s, n) {
    super(e, t, i, s, n), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = B(this, e, t, 0) ?? y) === j) return;
    const i = this._$AH, s = e === y && i !== y || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, n = e !== y && (i === y || s);
    s && this.element.removeEventListener(this.name, this, i), n && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class $t {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    B(this, e);
  }
}
const be = F.litHtmlPolyfillSupport;
be == null || be(Y, K), (F.litHtmlVersions ?? (F.litHtmlVersions = [])).push("3.3.1");
const vt = (r, e, t) => {
  const i = (t == null ? void 0 : t.renderBefore) ?? e;
  let s = i._$litPart$;
  if (s === void 0) {
    const n = (t == null ? void 0 : t.renderBefore) ?? null;
    i._$litPart$ = s = new K(e.insertBefore(q(), n), n, void 0, t ?? {});
  }
  return s._$AI(r), s;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const z = globalThis;
class w extends L {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var t;
    const e = super.createRenderRoot();
    return (t = this.renderOptions).renderBefore ?? (t.renderBefore = e.firstChild), e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = vt(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var e;
    super.connectedCallback(), (e = this._$Do) == null || e.setConnected(!0);
  }
  disconnectedCallback() {
    var e;
    super.disconnectedCallback(), (e = this._$Do) == null || e.setConnected(!1);
  }
  render() {
    return j;
  }
}
var Fe;
w._$litElement$ = !0, w.finalized = !0, (Fe = z.litElementHydrateSupport) == null || Fe.call(z, { LitElement: w });
const xe = z.litElementPolyfillSupport;
xe == null || xe({ LitElement: w });
(z.litElementVersions ?? (z.litElementVersions = [])).push("4.2.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const J = (r) => (e, t) => {
  t !== void 0 ? t.addInitializer((() => {
    customElements.define(r, e);
  })) : customElements.define(r, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const _t = { attribute: !0, type: String, converter: se, reflect: !1, hasChanged: we }, wt = (r = _t, e, t) => {
  const { kind: i, metadata: s } = t;
  let n = globalThis.litPropertyMetadata.get(s);
  if (n === void 0 && globalThis.litPropertyMetadata.set(s, n = /* @__PURE__ */ new Map()), i === "setter" && ((r = Object.create(r)).wrapped = !0), n.set(t.name, r), i === "accessor") {
    const { name: o } = t;
    return { set(a) {
      const c = e.get.call(this);
      e.set.call(this, a), this.requestUpdate(o, c, r);
    }, init(a) {
      return a !== void 0 && this.C(o, void 0, r, a), a;
    } };
  }
  if (i === "setter") {
    const { name: o } = t;
    return function(a) {
      const c = this[o];
      e.call(this, a), this.requestUpdate(o, c, r);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function u(r) {
  return (e, t) => typeof t == "object" ? wt(r, e, t) : ((i, s, n) => {
    const o = s.hasOwnProperty(n);
    return s.constructor.createProperty(n, i), o ? Object.getOwnPropertyDescriptor(s, n) : void 0;
  })(r, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function Z(r) {
  return u({ ...r, state: !0, attribute: !1 });
}
const Me = {
  en: {
    card: {
      noDataMessage: "No OER data available",
      untitledMessage: "Untitled Resource",
      licenseLabel: "License:",
      noLicenseMessage: "No license information"
    },
    list: {
      loadingMessage: "Loading resources...",
      emptyTitle: "No resources found",
      emptyMessage: "Try adjusting your search criteria or check back later."
    },
    pagination: {
      firstButtonText: "First",
      previousButtonText: "Previous",
      nextButtonText: "Next",
      lastButtonText: "Last",
      showingPagesText: "Showing",
      totalResourcesText: "total resources",
      pageOfText: "Page",
      ofText: "of"
    },
    search: {
      headerTitle: "Search OER",
      keywordsLabel: "Keyword search",
      nameLabel: "Name",
      languageLabel: "Language",
      licenseLabel: "License",
      freeForUseLabel: "Free for use",
      descriptionLabel: "Description",
      typeLabel: "Resource type",
      keywordsPlaceholder: "Search by keyword...",
      namePlaceholder: "Resource name...",
      languagePlaceholder: "e.g., en, de, fr",
      licensePlaceholder: "License URI...",
      descriptionPlaceholder: "Search in descriptions...",
      typePlaceholder: "e.g., image, video, document",
      searchingText: "Searching...",
      searchButtonText: "Search",
      clearButtonText: "Clear",
      anyOptionText: "Any",
      yesOptionText: "Yes",
      noOptionText: "No",
      firstButtonText: "First",
      previousButtonText: "Previous",
      nextButtonText: "Next",
      lastButtonText: "Last",
      showingPagesText: "Showing",
      totalResourcesText: "total resources",
      pageOfText: "Page",
      advancedFiltersShowText: "Show advanced filters",
      advancedFiltersHideText: "Hide advanced filters",
      errorMessage: "An error occurred"
    }
  },
  de: {
    card: {
      noDataMessage: "Keine OER-Daten verfügbar",
      untitledMessage: "Unbenannte Ressource",
      licenseLabel: "Lizenz:",
      noLicenseMessage: "Keine Lizenzinformationen"
    },
    list: {
      loadingMessage: "Ressourcen werden geladen...",
      emptyTitle: "Keine Ressourcen gefunden",
      emptyMessage: "Passen Sie Ihre Suchkriterien an oder versuchen Sie es später erneut."
    },
    pagination: {
      firstButtonText: "Erste",
      previousButtonText: "Zurück",
      nextButtonText: "Weiter",
      lastButtonText: "Letzte",
      showingPagesText: "Angezeigt",
      totalResourcesText: "Ressourcen insgesamt",
      pageOfText: "Seite",
      ofText: "von"
    },
    search: {
      headerTitle: "OER suchen",
      keywordsLabel: "Stichwortsuche",
      nameLabel: "Name",
      languageLabel: "Sprache",
      licenseLabel: "Lizenz",
      freeForUseLabel: "Kostenlos verfügbar",
      descriptionLabel: "Beschreibung",
      typeLabel: "Ressourcentyp",
      keywordsPlaceholder: "Nach einem Stichwort suchen...",
      namePlaceholder: "Ressourcenname...",
      languagePlaceholder: "z.B. de, en, fr",
      licensePlaceholder: "Lizenz-URI...",
      descriptionPlaceholder: "In Beschreibungen suchen...",
      typePlaceholder: "z.B. image, video, document",
      searchingText: "Suche läuft...",
      searchButtonText: "Suchen",
      clearButtonText: "Zurücksetzen",
      anyOptionText: "Alle",
      yesOptionText: "Ja",
      noOptionText: "Nein",
      firstButtonText: "Erste",
      previousButtonText: "Zurück",
      nextButtonText: "Weiter",
      lastButtonText: "Letzte",
      showingPagesText: "Angezeigt",
      totalResourcesText: "Ressourcen insgesamt",
      pageOfText: "Seite",
      advancedFiltersShowText: "Erweiterte Filter anzeigen",
      advancedFiltersHideText: "Erweiterte Filter ausblenden",
      errorMessage: "Ein Fehler ist aufgetreten"
    }
  }
};
function ae(r) {
  return Me[r] || Me.en;
}
function Pt(r) {
  return ae(r).card;
}
function At(r) {
  return ae(r).list;
}
function Ct(r) {
  return ae(r).search;
}
function St(r) {
  return ae(r).pagination;
}
const Je = [
  {
    uri: "https://creativecommons.org/publicdomain/zero/1.0/",
    shortName: "CC0 1.0"
  },
  {
    uri: "https://creativecommons.org/licenses/by/4.0/",
    shortName: "CC BY 4.0"
  },
  {
    uri: "https://creativecommons.org/licenses/by-sa/4.0/",
    shortName: "CC BY-SA 4.0"
  },
  {
    uri: "https://creativecommons.org/licenses/by-nd/4.0/",
    shortName: "CC BY-ND 4.0"
  },
  {
    uri: "https://creativecommons.org/licenses/by-nc/4.0/",
    shortName: "CC BY-NC 4.0"
  },
  {
    uri: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    shortName: "CC BY-NC-SA 4.0"
  },
  {
    uri: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    shortName: "CC BY-NC-ND 4.0"
  },
  {
    uri: "https://creativecommons.org/licenses/by/3.0/",
    shortName: "CC BY 3.0"
  },
  {
    uri: "https://creativecommons.org/licenses/by-sa/3.0/",
    shortName: "CC BY-SA 3.0"
  },
  {
    uri: "https://creativecommons.org/licenses/by-nd/3.0/",
    shortName: "CC BY-ND 3.0"
  },
  {
    uri: "https://creativecommons.org/licenses/by-nc/3.0/",
    shortName: "CC BY-NC 3.0"
  },
  {
    uri: "https://creativecommons.org/licenses/by-nc-sa/3.0/",
    shortName: "CC BY-NC-SA 3.0"
  },
  {
    uri: "https://creativecommons.org/licenses/by-nc-nd/3.0/",
    shortName: "CC BY-NC-ND 3.0"
  }
];
function Tt(r) {
  const e = Je.find((t) => t.uri === r);
  return e ? e.shortName : null;
}
function Ae(r, e) {
  return !r || r.length <= e ? r : r.slice(0, e - 3) + "...";
}
function Et(r) {
  return Ae(r, 40);
}
function Ot(r) {
  return Ae(r, 60);
}
function kt(r) {
  return Ae(r, 20);
}
function zt(r) {
  return r.slice(0, 4).map((e) => {
    const t = typeof e == "string" ? e : String(e);
    return kt(t);
  });
}
const Rt = ne`
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
`;
var Nt = Object.defineProperty, Ut = Object.getOwnPropertyDescriptor, le = (r, e, t, i) => {
  for (var s = i > 1 ? void 0 : i ? Ut(e, t) : e, n = r.length - 1, o; n >= 0; n--)
    (o = r[n]) && (s = (i ? o(e, t, s) : o(s)) || s);
  return i && s && Nt(e, t, s), s;
};
let M = class extends w {
  constructor() {
    super(...arguments), this.oer = null, this.onImageClick = null, this.language = "en";
  }
  get t() {
    return Pt(this.language);
  }
  handleImageClick() {
    this.oer && this.onImageClick && this.onImageClick(this.oer);
  }
  getLicenseName(r) {
    if (!r) return "Unknown License";
    const e = typeof r == "string" ? r : JSON.stringify(r), t = Tt(e);
    return t || (e.includes("creativecommons.org") ? "Creative Commons" : "License");
  }
  render() {
    var c, d, p, l, h;
    if (!this.oer)
      return f`
        <div class="card">
          <div class="content">
            <p class="no-data">${this.t.noDataMessage}</p>
          </div>
        </div>
      `;
    const r = (c = this.oer.amb_metadata) == null ? void 0 : c.image, e = Et(((d = this.oer.amb_metadata) == null ? void 0 : d.name) || this.t.untitledMessage), t = ((p = this.oer.amb_metadata) == null ? void 0 : p.description) || this.oer.amb_description, i = typeof t == "string" ? t : "", s = i ? Ot(i) : "", n = this.oer.amb_keywords || ((l = this.oer.amb_metadata) == null ? void 0 : l.keywords) || [], o = zt(n), a = this.oer.amb_license_uri || ((h = this.oer.amb_metadata) == null ? void 0 : h.license);
    return f`
      <div class="card">
        <div class="thumbnail-container" @click="${this.handleImageClick}">
          ${r ? f`<img
                class="thumbnail"
                src="${r}"
                alt="${this.oer.file_alt || e}"
                loading="lazy"
              />` : f`<div class="placeholder">📚</div>`}
        </div>
        <div class="content">
          <h3 class="title">${e}</h3>
          ${s ? f`<p class="description">${s}</p>` : ""}
          <div class="metadata">
            <div class="license">
              ${a ? f`${this.t.licenseLabel}
                    <a
                      href="${typeof a == "string" ? a : String(a)}"
                      target="_blank"
                      rel="noopener noreferrer"
                      >${this.getLicenseName(a)}</a
                    >` : f`<span class="no-data">${this.t.noLicenseMessage}</span>`}
            </div>
            ${o && o.length > 0 ? f`
                  <div class="keywords">
                    ${o.map(
      (g) => f`<span class="keyword">${g}</span>`
    )}
                  </div>
                ` : ""}
          </div>
        </div>
      </div>
    `;
  }
};
M.styles = Rt;
le([
  u({ type: Object })
], M.prototype, "oer", 2);
le([
  u({ type: Function })
], M.prototype, "onImageClick", 2);
le([
  u({ type: String })
], M.prototype, "language", 2);
M = le([
  J("oer-card")
], M);
const Lt = ne`
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
`;
var jt = Object.defineProperty, Bt = Object.getOwnPropertyDescriptor, G = (r, e, t, i) => {
  for (var s = i > 1 ? void 0 : i ? Bt(e, t) : e, n = r.length - 1, o; n >= 0; n--)
    (o = r[n]) && (s = (i ? o(e, t, s) : o(s)) || s);
  return i && s && jt(e, t, s), s;
};
let N = class extends w {
  constructor() {
    super(...arguments), this.metadata = null, this.loading = !1, this.onPageChange = null, this.language = "en";
  }
  get t() {
    return St(this.language);
  }
  render() {
    return this.metadata ? f`
      <div class="pagination">
        <div class="pagination-info">
          ${this.t.showingPagesText} ${this.t.pageOfText.toLowerCase()} ${this.metadata.page}
          ${this.t.ofText} ${this.metadata.totalPages} (${this.metadata.total}
          ${this.t.totalResourcesText})
        </div>
        <div class="pagination-controls">
          <button
            class="page-button"
            ?disabled="${this.metadata.page === 1 || this.loading}"
            @click="${() => this.handlePageChange(1)}"
          >
            ${this.t.firstButtonText}
          </button>
          <button
            class="page-button"
            ?disabled="${this.metadata.page === 1 || this.loading}"
            @click="${() => this.handlePageChange(this.metadata.page - 1)}"
          >
            ${this.t.previousButtonText}
          </button>
          <span class="page-info"
            >${this.t.pageOfText} ${this.metadata.page} ${this.t.ofText}
            ${this.metadata.totalPages}</span
          >
          <button
            class="page-button"
            ?disabled="${this.metadata.page === this.metadata.totalPages || this.loading}"
            @click="${() => this.handlePageChange(this.metadata.page + 1)}"
          >
            ${this.t.nextButtonText}
          </button>
          <button
            class="page-button"
            ?disabled="${this.metadata.page === this.metadata.totalPages || this.loading}"
            @click="${() => this.handlePageChange(this.metadata.totalPages)}"
          >
            ${this.t.lastButtonText}
          </button>
        </div>
      </div>
    ` : "";
  }
  handlePageChange(r) {
    this.onPageChange && this.onPageChange(r);
  }
};
N.styles = Lt;
G([
  u({ type: Object })
], N.prototype, "metadata", 2);
G([
  u({ type: Boolean })
], N.prototype, "loading", 2);
G([
  u({ type: Function })
], N.prototype, "onPageChange", 2);
G([
  u({ type: String })
], N.prototype, "language", 2);
N = G([
  J("oer-pagination")
], N);
const Mt = ne`
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
`;
var Ht = Object.defineProperty, Dt = Object.getOwnPropertyDescriptor, P = (r, e, t, i) => {
  for (var s = i > 1 ? void 0 : i ? Dt(e, t) : e, n = r.length - 1, o; n >= 0; n--)
    (o = r[n]) && (s = (i ? o(e, t, s) : o(s)) || s);
  return i && s && Ht(e, t, s), s;
};
let v = class extends w {
  constructor() {
    super(...arguments), this.oers = [], this.loading = !1, this.error = null, this.onCardClick = null, this.language = "en", this.showPagination = !1, this.metadata = null, this.onPageChange = null;
  }
  get t() {
    return At(this.language);
  }
  render() {
    return this.loading ? f`
        <div class="loading">
          <div class="loading-spinner"></div>
          <p>${this.t.loadingMessage}</p>
        </div>
      ` : this.error ? f`
        <div class="error">
          <div class="error-icon">⚠️</div>
          <p class="error-message">${this.error}</p>
        </div>
      ` : !this.oers || this.oers.length === 0 ? f`
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3 class="empty-title">${this.t.emptyTitle}</h3>
          <p class="empty-message">${this.t.emptyMessage}</p>
        </div>
      ` : f`
      <div class="list-container">
        <div class="grid">
          ${this.oers.map(
      (r) => f`
              <oer-card
                .oer="${r}"
                .onImageClick="${this.onCardClick}"
                .language="${this.language}"
              ></oer-card>
            `
    )}
        </div>
      </div>
      ${this.showPagination && this.metadata ? f`
            <oer-pagination
              .metadata="${this.metadata}"
              .loading="${this.loading}"
              .onPageChange="${this.onPageChange}"
              .language="${this.language}"
            ></oer-pagination>
          ` : ""}
    `;
  }
};
v.styles = Mt;
P([
  u({ type: Array })
], v.prototype, "oers", 2);
P([
  u({ type: Boolean })
], v.prototype, "loading", 2);
P([
  u({ type: String })
], v.prototype, "error", 2);
P([
  u({ type: Function })
], v.prototype, "onCardClick", 2);
P([
  u({ type: String })
], v.prototype, "language", 2);
P([
  u({ type: Boolean })
], v.prototype, "showPagination", 2);
P([
  u({ type: Object })
], v.prototype, "metadata", 2);
P([
  u({ type: Function })
], v.prototype, "onPageChange", 2);
v = P([
  J("oer-list")
], v);
const It = /\{[^{}]+\}/g, Ft = () => {
  var r, e;
  return typeof process == "object" && Number.parseInt((e = (r = process == null ? void 0 : process.versions) == null ? void 0 : r.node) == null ? void 0 : e.substring(0, 2)) >= 18 && process.versions.undici;
};
function qt() {
  return Math.random().toString(36).slice(2, 11);
}
function Wt(r) {
  let {
    baseUrl: e = "",
    Request: t = globalThis.Request,
    fetch: i = globalThis.fetch,
    querySerializer: s,
    bodySerializer: n,
    headers: o,
    requestInitExt: a = void 0,
    ...c
  } = { ...r };
  a = Ft() ? a : void 0, e = Ie(e);
  const d = [];
  async function p(l, h) {
    const {
      baseUrl: g,
      fetch: T = i,
      Request: sr = t,
      headers: Ce,
      params: U = {},
      parseAs: he = "json",
      querySerializer: Q,
      bodySerializer: Se = n ?? Vt,
      body: Te,
      ...de
    } = h || {};
    let pe = e;
    g && (pe = Ie(g) ?? e);
    let ue = typeof s == "function" ? s : He(s);
    Q && (ue = typeof Q == "function" ? Q : He({
      ...typeof s == "object" ? s : {},
      ...Q
    }));
    const fe = Te === void 0 ? void 0 : Se(
      Te,
      // Note: we declare mergeHeaders() both here and below because it’s a bit of a chicken-or-egg situation:
      // bodySerializer() needs all headers so we aren’t dropping ones set by the user, however,
      // the result of this ALSO sets the lowest-priority content-type header. So we re-merge below,
      // setting the content-type at the very beginning to be overwritten.
      // Lastly, based on the way headers work, it’s not a simple “present-or-not” check becauase null intentionally un-sets headers.
      De(o, Ce, U.header)
    ), tt = De(
      // with no body, we should not to set Content-Type
      fe === void 0 || // if serialized body is FormData; browser will correctly set Content-Type & boundary expression
      fe instanceof FormData ? {} : {
        "Content-Type": "application/json"
      },
      o,
      Ce,
      U.header
    ), rt = {
      redirect: "follow",
      ...c,
      ...de,
      body: fe,
      headers: tt
    };
    let X, ee, A = new t(
      Kt(l, { baseUrl: pe, params: U, querySerializer: ue }),
      rt
    ), m;
    for (const x in de)
      x in A || (A[x] = de[x]);
    if (d.length) {
      X = qt(), ee = Object.freeze({
        baseUrl: pe,
        fetch: T,
        parseAs: he,
        querySerializer: ue,
        bodySerializer: Se
      });
      for (const x of d)
        if (x && typeof x == "object" && typeof x.onRequest == "function") {
          const b = await x.onRequest({
            request: A,
            schemaPath: l,
            params: U,
            options: ee,
            id: X
          });
          if (b)
            if (b instanceof t)
              A = b;
            else if (b instanceof Response) {
              m = b;
              break;
            } else
              throw new Error("onRequest: must return new Request() or Response() when modifying the request");
        }
    }
    if (!m) {
      try {
        m = await T(A, a);
      } catch (x) {
        let b = x;
        if (d.length)
          for (let E = d.length - 1; E >= 0; E--) {
            const te = d[E];
            if (te && typeof te == "object" && typeof te.onError == "function") {
              const H = await te.onError({
                request: A,
                error: b,
                schemaPath: l,
                params: U,
                options: ee,
                id: X
              });
              if (H) {
                if (H instanceof Response) {
                  b = void 0, m = H;
                  break;
                }
                if (H instanceof Error) {
                  b = H;
                  continue;
                }
                throw new Error("onError: must return new Response() or instance of Error");
              }
            }
          }
        if (b)
          throw b;
      }
      if (d.length)
        for (let x = d.length - 1; x >= 0; x--) {
          const b = d[x];
          if (b && typeof b == "object" && typeof b.onResponse == "function") {
            const E = await b.onResponse({
              request: A,
              response: m,
              schemaPath: l,
              params: U,
              options: ee,
              id: X
            });
            if (E) {
              if (!(E instanceof Response))
                throw new Error("onResponse: must return new Response() when modifying the response");
              m = E;
            }
          }
        }
    }
    if (m.status === 204 || A.method === "HEAD" || m.headers.get("Content-Length") === "0")
      return m.ok ? { data: void 0, response: m } : { error: void 0, response: m };
    if (m.ok)
      return he === "stream" ? { data: m.body, response: m } : { data: await m[he](), response: m };
    let ge = await m.text();
    try {
      ge = JSON.parse(ge);
    } catch {
    }
    return { error: ge, response: m };
  }
  return {
    request(l, h, g) {
      return p(h, { ...g, method: l.toUpperCase() });
    },
    /** Call a GET endpoint */
    GET(l, h) {
      return p(l, { ...h, method: "GET" });
    },
    /** Call a PUT endpoint */
    PUT(l, h) {
      return p(l, { ...h, method: "PUT" });
    },
    /** Call a POST endpoint */
    POST(l, h) {
      return p(l, { ...h, method: "POST" });
    },
    /** Call a DELETE endpoint */
    DELETE(l, h) {
      return p(l, { ...h, method: "DELETE" });
    },
    /** Call a OPTIONS endpoint */
    OPTIONS(l, h) {
      return p(l, { ...h, method: "OPTIONS" });
    },
    /** Call a HEAD endpoint */
    HEAD(l, h) {
      return p(l, { ...h, method: "HEAD" });
    },
    /** Call a PATCH endpoint */
    PATCH(l, h) {
      return p(l, { ...h, method: "PATCH" });
    },
    /** Call a TRACE endpoint */
    TRACE(l, h) {
      return p(l, { ...h, method: "TRACE" });
    },
    /** Register middleware */
    use(...l) {
      for (const h of l)
        if (h) {
          if (typeof h != "object" || !("onRequest" in h || "onResponse" in h || "onError" in h))
            throw new Error("Middleware must be an object with one of `onRequest()`, `onResponse() or `onError()`");
          d.push(h);
        }
    },
    /** Unregister middleware */
    eject(...l) {
      for (const h of l) {
        const g = d.indexOf(h);
        g !== -1 && d.splice(g, 1);
      }
    }
  };
}
function ce(r, e, t) {
  if (e == null)
    return "";
  if (typeof e == "object")
    throw new Error(
      "Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these."
    );
  return `${r}=${(t == null ? void 0 : t.allowReserved) === !0 ? e : encodeURIComponent(e)}`;
}
function Ze(r, e, t) {
  if (!e || typeof e != "object")
    return "";
  const i = [], s = {
    simple: ",",
    label: ".",
    matrix: ";"
  }[t.style] || "&";
  if (t.style !== "deepObject" && t.explode === !1) {
    for (const a in e)
      i.push(a, t.allowReserved === !0 ? e[a] : encodeURIComponent(e[a]));
    const o = i.join(",");
    switch (t.style) {
      case "form":
        return `${r}=${o}`;
      case "label":
        return `.${o}`;
      case "matrix":
        return `;${r}=${o}`;
      default:
        return o;
    }
  }
  for (const o in e) {
    const a = t.style === "deepObject" ? `${r}[${o}]` : o;
    i.push(ce(a, e[o], t));
  }
  const n = i.join(s);
  return t.style === "label" || t.style === "matrix" ? `${s}${n}` : n;
}
function Ge(r, e, t) {
  if (!Array.isArray(e))
    return "";
  if (t.explode === !1) {
    const n = { form: ",", spaceDelimited: "%20", pipeDelimited: "|" }[t.style] || ",", o = (t.allowReserved === !0 ? e : e.map((a) => encodeURIComponent(a))).join(n);
    switch (t.style) {
      case "simple":
        return o;
      case "label":
        return `.${o}`;
      case "matrix":
        return `;${r}=${o}`;
      // case "spaceDelimited":
      // case "pipeDelimited":
      default:
        return `${r}=${o}`;
    }
  }
  const i = { simple: ",", label: ".", matrix: ";" }[t.style] || "&", s = [];
  for (const n of e)
    t.style === "simple" || t.style === "label" ? s.push(t.allowReserved === !0 ? n : encodeURIComponent(n)) : s.push(ce(r, n, t));
  return t.style === "label" || t.style === "matrix" ? `${i}${s.join(i)}` : s.join(i);
}
function He(r) {
  return function(t) {
    const i = [];
    if (t && typeof t == "object")
      for (const s in t) {
        const n = t[s];
        if (n != null) {
          if (Array.isArray(n)) {
            if (n.length === 0)
              continue;
            i.push(
              Ge(s, n, {
                style: "form",
                explode: !0,
                ...r == null ? void 0 : r.array,
                allowReserved: (r == null ? void 0 : r.allowReserved) || !1
              })
            );
            continue;
          }
          if (typeof n == "object") {
            i.push(
              Ze(s, n, {
                style: "deepObject",
                explode: !0,
                ...r == null ? void 0 : r.object,
                allowReserved: (r == null ? void 0 : r.allowReserved) || !1
              })
            );
            continue;
          }
          i.push(ce(s, n, r));
        }
      }
    return i.join("&");
  };
}
function Yt(r, e) {
  let t = r;
  for (const i of r.match(It) ?? []) {
    let s = i.substring(1, i.length - 1), n = !1, o = "simple";
    if (s.endsWith("*") && (n = !0, s = s.substring(0, s.length - 1)), s.startsWith(".") ? (o = "label", s = s.substring(1)) : s.startsWith(";") && (o = "matrix", s = s.substring(1)), !e || e[s] === void 0 || e[s] === null)
      continue;
    const a = e[s];
    if (Array.isArray(a)) {
      t = t.replace(i, Ge(s, a, { style: o, explode: n }));
      continue;
    }
    if (typeof a == "object") {
      t = t.replace(i, Ze(s, a, { style: o, explode: n }));
      continue;
    }
    if (o === "matrix") {
      t = t.replace(i, `;${ce(s, a)}`);
      continue;
    }
    t = t.replace(i, o === "label" ? `.${encodeURIComponent(a)}` : encodeURIComponent(a));
  }
  return t;
}
function Vt(r, e) {
  return r instanceof FormData ? r : e && (e.get instanceof Function ? e.get("Content-Type") ?? e.get("content-type") : e["Content-Type"] ?? e["content-type"]) === "application/x-www-form-urlencoded" ? new URLSearchParams(r).toString() : JSON.stringify(r);
}
function Kt(r, e) {
  var s;
  let t = `${e.baseUrl}${r}`;
  (s = e.params) != null && s.path && (t = Yt(t, e.params.path));
  let i = e.querySerializer(e.params.query ?? {});
  return i.startsWith("?") && (i = i.substring(1)), i && (t += `?${i}`), t;
}
function De(...r) {
  const e = new Headers();
  for (const t of r) {
    if (!t || typeof t != "object")
      continue;
    const i = t instanceof Headers ? t.entries() : Object.entries(t);
    for (const [s, n] of i)
      if (n === null)
        e.delete(s);
      else if (Array.isArray(n))
        for (const o of n)
          e.append(s, o);
      else n !== void 0 && e.set(s, n);
  }
  return e;
}
function Ie(r) {
  return r.endsWith("/") ? r.substring(0, r.length - 1) : r;
}
function Jt(r, e) {
  return Wt({
    baseUrl: r.replace(/\/$/, ""),
    // Remove trailing slash
    headers: e == null ? void 0 : e.headers,
    fetch: e == null ? void 0 : e.fetch
  });
}
const Zt = ne`
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
`;
var Gt = Object.defineProperty, Qt = Object.getOwnPropertyDescriptor, _ = (r, e, t, i) => {
  for (var s = i > 1 ? void 0 : i ? Qt(e, t) : e, n = r.length - 1, o; n >= 0; n--)
    (o = r[n]) && (s = (i ? o(e, t, s) : o(s)) || s);
  return i && s && Gt(e, t, s), s;
};
let $ = class extends w {
  constructor() {
    super(...arguments), this.apiUrl = "http://localhost:3000", this.language = "en", this.showTypeFilter = !0, this.pageSize = 20, this.client = null, this.searchParams = {
      page: 1
    }, this.loading = !1, this.error = null, this.advancedFiltersExpanded = !1;
  }
  get t() {
    return Ct(this.language);
  }
  connectedCallback() {
    super.connectedCallback(), this.client = Jt(this.apiUrl), this.searchParams = {
      ...this.searchParams,
      pageSize: this.pageSize
    }, this.lockedType && (this.searchParams = {
      ...this.searchParams,
      type: this.lockedType
    });
  }
  async performSearch() {
    if (this.client) {
      this.loading = !0, this.error = null;
      try {
        const r = await this.client.GET("/api/v1/oer", {
          params: {
            query: this.searchParams
          }
        });
        if (r.error) {
          const e = r.error.message ? Array.isArray(r.error.message) ? r.error.message.join(", ") : r.error.message : "Failed to fetch resources";
          throw new Error(e);
        }
        r.data && this.dispatchEvent(
          new CustomEvent("search-results", {
            detail: {
              data: r.data.data,
              meta: r.data.meta
            },
            bubbles: !0,
            composed: !0
          })
        );
      } catch (r) {
        this.error = r instanceof Error ? r.message : this.t.errorMessage, this.dispatchEvent(
          new CustomEvent("search-error", {
            detail: { error: this.error },
            bubbles: !0,
            composed: !0
          })
        );
      } finally {
        this.loading = !1;
      }
    }
  }
  handleSubmit(r) {
    r.preventDefault(), this.searchParams = { ...this.searchParams, page: 1 }, this.performSearch();
  }
  handleClear() {
    this.searchParams = {
      page: 1,
      pageSize: this.pageSize
    }, this.lockedType && (this.searchParams = {
      ...this.searchParams,
      type: this.lockedType
    }), this.error = null, this.dispatchEvent(
      new CustomEvent("search-cleared", {
        bubbles: !0,
        composed: !0
      })
    );
  }
  handleInputChange(r) {
    return (e) => {
      const i = e.target.value.trim();
      if (i === "") {
        const { [r]: s, ...n } = this.searchParams;
        this.searchParams = n;
      } else
        this.searchParams = {
          ...this.searchParams,
          [r]: i
        };
    };
  }
  handleBooleanChange(r) {
    return (e) => {
      const i = e.target.value;
      if (i === "") {
        const { [r]: s, ...n } = this.searchParams;
        this.searchParams = n;
      } else
        this.searchParams = {
          ...this.searchParams,
          [r]: i === "true"
        };
    };
  }
  toggleAdvancedFilters() {
    this.advancedFiltersExpanded = !this.advancedFiltersExpanded;
  }
  handlePageChange(r) {
    this.searchParams = { ...this.searchParams, page: r }, this.performSearch();
  }
  render() {
    return f`
      <div class="search-container">
        <h2 class="search-header">${this.t.headerTitle}</h2>
        <form class="search-form" @submit="${this.handleSubmit}">
          <div class="form-group">
            <label for="keywords">${this.t.keywordsLabel}</label>
            <input
              id="keywords"
              type="text"
              placeholder="${this.t.keywordsPlaceholder}"
              .value="${this.searchParams.keywords || ""}"
              @input="${this.handleInputChange("keywords")}"
            />
          </div>

          ${this.showTypeFilter && !this.lockedType ? f`
                <div class="form-group">
                  <label for="type">${this.t.typeLabel}</label>
                  <input
                    id="type"
                    type="text"
                    placeholder="${this.t.typePlaceholder}"
                    .value="${this.searchParams.type || ""}"
                    @input="${this.handleInputChange("type")}"
                  />
                </div>
              ` : ""}

          <button
            type="button"
            class="toggle-filters-button"
            @click="${this.toggleAdvancedFilters}"
          >
            ${this.advancedFiltersExpanded ? this.t.advancedFiltersHideText : this.t.advancedFiltersShowText}
          </button>

          <div class="advanced-filters ${this.advancedFiltersExpanded ? "expanded" : ""}">
            <div class="form-row">
              <div class="form-group">
                <label for="name">${this.t.nameLabel}</label>
                <input
                  id="name"
                  type="text"
                  placeholder="${this.t.namePlaceholder}"
                  .value="${this.searchParams.name || ""}"
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
                  .value="${this.searchParams.language || ""}"
                  @input="${this.handleInputChange("language")}"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="license">${this.t.licenseLabel}</label>
                <select
                  id="license"
                  .value="${this.searchParams.license || ""}"
                  @change="${this.handleInputChange("license")}"
                >
                  <option value="">${this.t.anyOptionText}</option>
                  ${Je.map(
      (r) => f`
                      <option value="${r.uri}">${r.shortName}</option>
                    `
    )}
                </select>
              </div>

              <div class="form-group">
                <label for="free_for_use">${this.t.freeForUseLabel}</label>
                <select
                  id="free_for_use"
                  .value="${this.searchParams.free_for_use === void 0 ? "" : String(this.searchParams.free_for_use)}"
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
                .value="${this.searchParams.description || ""}"
                @input="${this.handleInputChange("description")}"
              />
            </div>
          </div>

          <div class="button-group">
            <button type="submit" class="search-button" ?disabled="${this.loading}">
              ${this.loading ? this.t.searchingText : this.t.searchButtonText}
            </button>
            <button type="button" class="clear-button" @click="${this.handleClear}">
              ${this.t.clearButtonText}
            </button>
          </div>

          ${this.error ? f`<div class="error-message">${this.error}</div>` : ""}
        </form>
      </div>
    `;
  }
};
$.styles = Zt;
_([
  u({ type: String, attribute: "api-url" })
], $.prototype, "apiUrl", 2);
_([
  u({ type: String })
], $.prototype, "language", 2);
_([
  u({ type: String, attribute: "locked-type" })
], $.prototype, "lockedType", 2);
_([
  u({ type: Boolean, attribute: "show-type-filter" })
], $.prototype, "showTypeFilter", 2);
_([
  u({ type: Number, attribute: "page-size" })
], $.prototype, "pageSize", 2);
_([
  Z()
], $.prototype, "client", 2);
_([
  Z()
], $.prototype, "searchParams", 2);
_([
  Z()
], $.prototype, "loading", 2);
_([
  Z()
], $.prototype, "error", 2);
_([
  Z()
], $.prototype, "advancedFiltersExpanded", 2);
$ = _([
  J("oer-search")
], $);
const V = {
  name: "default",
  colors: {
    // Primary interaction colors (existing colors from components)
    primary: "#667eea",
    primaryHover: "#5568d3",
    secondary: "#764ba2",
    // Background colors
    background: {
      page: "#ffffff",
      card: "#ffffff",
      form: "#f8f9fa"
    },
    // Text colors
    text: {
      primary: "#2d3748",
      secondary: "#4a5568",
      muted: "#718096"
    }
  }
}, Xt = {
  name: "dark",
  colors: {
    // Primary interaction colors
    primary: "#7c3aed",
    primaryHover: "#6d28d9",
    secondary: "#8b5cf6",
    // Background colors
    background: {
      page: "#1a202c",
      card: "#2d3748",
      form: "#374151"
    },
    // Text colors
    text: {
      primary: "#f7fafc",
      secondary: "#e2e8f0",
      muted: "#a0aec0"
    }
  }
}, Qe = {
  default: V,
  dark: Xt
};
function er(r) {
  return Qe[r] || V;
}
function Xe(r) {
  return typeof r == "string" && r in Qe;
}
var tr = Object.defineProperty, rr = Object.getOwnPropertyDescriptor, et = (r, e, t, i) => {
  for (var s = i > 1 ? void 0 : i ? rr(e, t) : e, n = r.length - 1, o; n >= 0; n--)
    (o = r[n]) && (s = (i ? o(e, t, s) : o(s)) || s);
  return i && s && tr(e, t, s), s;
};
let $e = class extends w {
  constructor() {
    super(...arguments), this._theme = V;
  }
  set theme(r) {
    const e = this._theme;
    Xe(r) ? this._theme = er(r) : typeof r == "object" && r !== null && "colors" in r ? this._theme = r : this._theme = V, this.requestUpdate("theme", e);
  }
  get theme() {
    return this._theme;
  }
  /**
   * Update CSS variables when theme changes
   * CSS variables are set on the host element so child components can inherit them
   */
  updated(r) {
    r.has("theme") && (this.style.setProperty("--primary-color", this._theme.colors.primary), this.style.setProperty("--primary-hover-color", this._theme.colors.primaryHover), this.style.setProperty("--secondary-color", this._theme.colors.secondary), this.style.setProperty("--background-card", this._theme.colors.background.card), this.style.setProperty("--background-form", this._theme.colors.background.form), this.style.setProperty("--text-primary", this._theme.colors.text.primary), this.style.setProperty("--text-secondary", this._theme.colors.text.secondary), this.style.setProperty("--text-muted", this._theme.colors.text.muted));
  }
  /**
   * Render children in a slot (no shadow DOM styling needed)
   */
  render() {
    return f`<slot></slot>`;
  }
};
et([
  u({
    converter: {
      fromAttribute: (r) => r ? Xe(r) ? r : (console.warn(
        `Invalid theme name "${r}". Falling back to "default". Valid theme names: 'default', 'dark'`
      ), "default") : "default",
      toAttribute: (r) => typeof r == "string" ? r : r.name
    }
  })
], $e.prototype, "theme", 1);
$e = et([
  J("oer-theme-provider")
], $e);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const or = "oer-theme", ar = V, lr = "0.0.1";
export {
  M as OerCardElement,
  v as OerListElement,
  $ as OerSearchElement,
  $e as OerThemeProvider,
  N as PaginationElement,
  lr as VERSION,
  Jt as createOerClient,
  Xt as darkTheme,
  V as defaultTheme,
  ar as defaultThemeValue,
  Pt as getCardTranslations,
  At as getListTranslations,
  St as getPaginationTranslations,
  Ct as getSearchTranslations,
  er as getTheme,
  ae as getTranslations,
  Xe as isThemeName,
  zt as shortenLabels,
  or as themeContext,
  Qe as themes,
  Ot as truncateContent,
  kt as truncateLabel,
  Ae as truncateText,
  Et as truncateTitle
};
