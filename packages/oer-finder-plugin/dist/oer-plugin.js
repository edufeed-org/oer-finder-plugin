/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const oe = globalThis, _e = oe.ShadowRoot && (oe.ShadyCSS === void 0 || oe.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Se = Symbol(), Ce = /* @__PURE__ */ new WeakMap();
let We = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== Se) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (_e && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = Ce.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && Ce.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const tt = (r) => new We(typeof r == "string" ? r : r + "", void 0, Se), ce = (r, ...e) => {
  const t = r.length === 1 ? r[0] : e.reduce(((i, s, n) => i + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + r[n + 1]), r[0]);
  return new We(t, r, Se);
}, rt = (r, e) => {
  if (_e) r.adoptedStyleSheets = e.map(((t) => t instanceof CSSStyleSheet ? t : t.styleSheet));
  else for (const t of e) {
    const i = document.createElement("style"), s = oe.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = t.cssText, r.appendChild(i);
  }
}, ke = _e ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return tt(t);
})(r) : r;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: st, defineProperty: it, getOwnPropertyDescriptor: nt, getOwnPropertyNames: ot, getOwnPropertySymbols: at, getPrototypeOf: lt } = Object, E = globalThis, ze = E.trustedTypes, ct = ze ? ze.emptyScript : "", xe = E.reactiveElementPolyfillSupport, V = (r, e) => r, ae = { toAttribute(r, e) {
  switch (e) {
    case Boolean:
      r = r ? ct : null;
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
} }, Ae = (r, e) => !st(r, e), Oe = { attribute: !0, type: String, converter: ae, reflect: !1, useDefault: !1, hasChanged: Ae };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), E.litPropertyMetadata ?? (E.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let j = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = Oe) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = Symbol(), s = this.getPropertyDescriptor(e, i, t);
      s !== void 0 && it(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: s, set: n } = nt(this.prototype, e) ?? { get() {
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
    return this.elementProperties.get(e) ?? Oe;
  }
  static _$Ei() {
    if (this.hasOwnProperty(V("elementProperties"))) return;
    const e = lt(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(V("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(V("properties"))) {
      const t = this.properties, i = [...ot(t), ...at(t)];
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
      for (const s of i) t.unshift(ke(s));
    } else e !== void 0 && t.push(ke(e));
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
    return rt(e, this.constructor.elementStyles), e;
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
      const o = (((n = i.converter) == null ? void 0 : n.toAttribute) !== void 0 ? i.converter : ae).toAttribute(t, i.type);
      this._$Em = e, o == null ? this.removeAttribute(s) : this.setAttribute(s, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var n, o;
    const i = this.constructor, s = i._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const a = i.getPropertyOptions(s), c = typeof a.converter == "function" ? { fromAttribute: a.converter } : ((n = a.converter) == null ? void 0 : n.fromAttribute) !== void 0 ? a.converter : ae;
      this._$Em = s;
      const h = c.fromAttribute(t, a.type);
      this[s] = h ?? ((o = this._$Ej) == null ? void 0 : o.get(s)) ?? h, this._$Em = null;
    }
  }
  requestUpdate(e, t, i) {
    var s;
    if (e !== void 0) {
      const n = this.constructor, o = this[e];
      if (i ?? (i = n.getPropertyOptions(e)), !((i.hasChanged ?? Ae)(o, t) || i.useDefault && i.reflect && o === ((s = this._$Ej) == null ? void 0 : s.get(e)) && !this.hasAttribute(n._$Eu(e, i)))) return;
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
j.elementStyles = [], j.shadowRootOptions = { mode: "open" }, j[V("elementProperties")] = /* @__PURE__ */ new Map(), j[V("finalized")] = /* @__PURE__ */ new Map(), xe == null || xe({ ReactiveElement: j }), (E.reactiveElementVersions ?? (E.reactiveElementVersions = [])).push("2.1.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const K = globalThis, le = K.trustedTypes, Re = le ? le.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, Ye = "$lit$", A = `lit$${Math.random().toFixed(9).slice(2)}$`, Ve = "?" + A, dt = `<${Ve}>`, R = document, G = () => R.createComment(""), J = (r) => r === null || typeof r != "object" && typeof r != "function", Ee = Array.isArray, ht = (r) => Ee(r) || typeof (r == null ? void 0 : r[Symbol.iterator]) == "function", ve = `[ 	
\f\r]`, Y = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ue = /-->/g, Le = />/g, k = RegExp(`>|${ve}(?:([^\\s"'>=/]+)(${ve}*=${ve}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Ne = /'/g, je = /"/g, Ke = /^(?:script|style|textarea|title)$/i, pt = (r) => (e, ...t) => ({ _$litType$: r, strings: e, values: t }), u = pt(1), M = Symbol.for("lit-noChange"), m = Symbol.for("lit-nothing"), Me = /* @__PURE__ */ new WeakMap(), z = R.createTreeWalker(R, 129);
function Ge(r, e) {
  if (!Ee(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Re !== void 0 ? Re.createHTML(e) : e;
}
const ut = (r, e) => {
  const t = r.length - 1, i = [];
  let s, n = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = Y;
  for (let a = 0; a < t; a++) {
    const c = r[a];
    let h, p, l = -1, d = 0;
    for (; d < c.length && (o.lastIndex = d, p = o.exec(c), p !== null); ) d = o.lastIndex, o === Y ? p[1] === "!--" ? o = Ue : p[1] !== void 0 ? o = Le : p[2] !== void 0 ? (Ke.test(p[2]) && (s = RegExp("</" + p[2], "g")), o = k) : p[3] !== void 0 && (o = k) : o === k ? p[0] === ">" ? (o = s ?? Y, l = -1) : p[1] === void 0 ? l = -2 : (l = o.lastIndex - p[2].length, h = p[1], o = p[3] === void 0 ? k : p[3] === '"' ? je : Ne) : o === je || o === Ne ? o = k : o === Ue || o === Le ? o = Y : (o = k, s = void 0);
    const g = o === k && r[a + 1].startsWith("/>") ? " " : "";
    n += o === Y ? c + dt : l >= 0 ? (i.push(h), c.slice(0, l) + Ye + c.slice(l) + A + g) : c + A + (l === -2 ? a : g);
  }
  return [Ge(r, n + (r[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class Z {
  constructor({ strings: e, _$litType$: t }, i) {
    let s;
    this.parts = [];
    let n = 0, o = 0;
    const a = e.length - 1, c = this.parts, [h, p] = ut(e, t);
    if (this.el = Z.createElement(h, i), z.currentNode = this.el.content, t === 2 || t === 3) {
      const l = this.el.content.firstChild;
      l.replaceWith(...l.childNodes);
    }
    for (; (s = z.nextNode()) !== null && c.length < a; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const l of s.getAttributeNames()) if (l.endsWith(Ye)) {
          const d = p[o++], g = s.getAttribute(l).split(A), w = /([.?@])?(.*)/.exec(d);
          c.push({ type: 1, index: n, name: w[2], strings: g, ctor: w[1] === "." ? ft : w[1] === "?" ? mt : w[1] === "@" ? bt : de }), s.removeAttribute(l);
        } else l.startsWith(A) && (c.push({ type: 6, index: n }), s.removeAttribute(l));
        if (Ke.test(s.tagName)) {
          const l = s.textContent.split(A), d = l.length - 1;
          if (d > 0) {
            s.textContent = le ? le.emptyScript : "";
            for (let g = 0; g < d; g++) s.append(l[g], G()), z.nextNode(), c.push({ type: 2, index: ++n });
            s.append(l[d], G());
          }
        }
      } else if (s.nodeType === 8) if (s.data === Ve) c.push({ type: 2, index: n });
      else {
        let l = -1;
        for (; (l = s.data.indexOf(A, l + 1)) !== -1; ) c.push({ type: 7, index: n }), l += A.length - 1;
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
  if (e === M) return e;
  let s = i !== void 0 ? (o = t._$Co) == null ? void 0 : o[i] : t._$Cl;
  const n = J(e) ? void 0 : e._$litDirective$;
  return (s == null ? void 0 : s.constructor) !== n && ((a = s == null ? void 0 : s._$AO) == null || a.call(s, !1), n === void 0 ? s = void 0 : (s = new n(r), s._$AT(r, t, i)), i !== void 0 ? (t._$Co ?? (t._$Co = []))[i] = s : t._$Cl = s), s !== void 0 && (e = B(r, s._$AS(r, e.values), s, i)), e;
}
class gt {
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
    z.currentNode = s;
    let n = z.nextNode(), o = 0, a = 0, c = i[0];
    for (; c !== void 0; ) {
      if (o === c.index) {
        let h;
        c.type === 2 ? h = new X(n, n.nextSibling, this, e) : c.type === 1 ? h = new c.ctor(n, c.name, c.strings, this, e) : c.type === 6 && (h = new yt(n, this, e)), this._$AV.push(h), c = i[++a];
      }
      o !== (c == null ? void 0 : c.index) && (n = z.nextNode(), o++);
    }
    return z.currentNode = R, s;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class X {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, i, s) {
    this.type = 2, this._$AH = m, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = s, this._$Cv = (s == null ? void 0 : s.isConnected) ?? !0;
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
    e = B(this, e, t), J(e) ? e === m || e == null || e === "" ? (this._$AH !== m && this._$AR(), this._$AH = m) : e !== this._$AH && e !== M && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : ht(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== m && J(this._$AH) ? this._$AA.nextSibling.data = e : this.T(R.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var n;
    const { values: t, _$litType$: i } = e, s = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = Z.createElement(Ge(i.h, i.h[0]), this.options)), i);
    if (((n = this._$AH) == null ? void 0 : n._$AD) === s) this._$AH.p(t);
    else {
      const o = new gt(s, this), a = o.u(this.options);
      o.p(t), this.T(a), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = Me.get(e.strings);
    return t === void 0 && Me.set(e.strings, t = new Z(e)), t;
  }
  k(e) {
    Ee(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, s = 0;
    for (const n of e) s === t.length ? t.push(i = new X(this.O(G()), this.O(G()), this, this.options)) : i = t[s], i._$AI(n), s++;
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
class de {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, s, n) {
    this.type = 1, this._$AH = m, this._$AN = void 0, this.element = e, this.name = t, this._$AM = s, this.options = n, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = m;
  }
  _$AI(e, t = this, i, s) {
    const n = this.strings;
    let o = !1;
    if (n === void 0) e = B(this, e, t, 0), o = !J(e) || e !== this._$AH && e !== M, o && (this._$AH = e);
    else {
      const a = e;
      let c, h;
      for (e = n[0], c = 0; c < n.length - 1; c++) h = B(this, a[i + c], t, c), h === M && (h = this._$AH[c]), o || (o = !J(h) || h !== this._$AH[c]), h === m ? e = m : e !== m && (e += (h ?? "") + n[c + 1]), this._$AH[c] = h;
    }
    o && !s && this.j(e);
  }
  j(e) {
    e === m ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class ft extends de {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === m ? void 0 : e;
  }
}
class mt extends de {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== m);
  }
}
class bt extends de {
  constructor(e, t, i, s, n) {
    super(e, t, i, s, n), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = B(this, e, t, 0) ?? m) === M) return;
    const i = this._$AH, s = e === m && i !== m || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, n = e !== m && (i === m || s);
    s && this.element.removeEventListener(this.name, this, i), n && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class yt {
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
const $e = K.litHtmlPolyfillSupport;
$e == null || $e(Z, X), (K.litHtmlVersions ?? (K.litHtmlVersions = [])).push("3.3.1");
const xt = (r, e, t) => {
  const i = (t == null ? void 0 : t.renderBefore) ?? e;
  let s = i._$litPart$;
  if (s === void 0) {
    const n = (t == null ? void 0 : t.renderBefore) ?? null;
    i._$litPart$ = s = new X(e.insertBefore(G(), n), n, void 0, t ?? {});
  }
  return s._$AI(r), s;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const O = globalThis;
class T extends j {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = xt(t, this.renderRoot, this.renderOptions);
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
    return M;
  }
}
var qe;
T._$litElement$ = !0, T.finalized = !0, (qe = O.litElementHydrateSupport) == null || qe.call(O, { LitElement: T });
const we = O.litElementPolyfillSupport;
we == null || we({ LitElement: T });
(O.litElementVersions ?? (O.litElementVersions = [])).push("4.2.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const he = (r) => (e, t) => {
  t !== void 0 ? t.addInitializer((() => {
    customElements.define(r, e);
  })) : customElements.define(r, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const vt = { attribute: !0, type: String, converter: ae, reflect: !1, hasChanged: Ae }, $t = (r = vt, e, t) => {
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
function b(r) {
  return (e, t) => typeof t == "object" ? $t(r, e, t) : ((i, s, n) => {
    const o = s.hasOwnProperty(n);
    return s.constructor.createProperty(n, i), o ? Object.getOwnPropertyDescriptor(s, n) : void 0;
  })(r, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function ee(r) {
  return b({ ...r, state: !0, attribute: !1 });
}
const Be = {
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
      languageLabel: "Language",
      licenseLabel: "License",
      freeForUseLabel: "Free for use",
      sourceLabel: "Source",
      typeLabel: "Resource type",
      keywordsPlaceholder: "Search by keyword...",
      languagePlaceholder: "e.g., en, de, fr",
      licensePlaceholder: "License URI...",
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
      languageLabel: "Sprache",
      licenseLabel: "Lizenz",
      freeForUseLabel: "Kostenlos verfügbar",
      sourceLabel: "Quelle",
      typeLabel: "Ressourcentyp",
      keywordsPlaceholder: "Nach einem Stichwort suchen...",
      languagePlaceholder: "z.B. de, en, fr",
      licensePlaceholder: "Lizenz-URI...",
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
function pe(r) {
  return Be[r] || Be.en;
}
function wt(r) {
  return pe(r).card;
}
function _t(r) {
  return pe(r).list;
}
function St(r) {
  return pe(r).search;
}
function At(r) {
  return pe(r).pagination;
}
const ne = "nostr", Je = [
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
function Et(r) {
  const e = Je.find((t) => t.uri === r);
  return e ? e.shortName : null;
}
const Tt = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" }
], Pt = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "text", label: "Text" },
  { value: "application/pdf", label: "PDF" }
];
function Te(r, e) {
  return !r || r.length <= e ? r : r.slice(0, e - 3) + "...";
}
function Ct(r) {
  return Te(r, 40);
}
function kt(r) {
  return Te(r, 60);
}
function zt(r) {
  return Te(r, 20);
}
function Ot(r) {
  return r.slice(0, 4).map((e) => {
    const t = typeof e == "string" ? e : String(e);
    return zt(t);
  });
}
const Rt = ce`
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
`;
var Ut = Object.defineProperty, Lt = Object.getOwnPropertyDescriptor, Pe = (r, e, t, i) => {
  for (var s = i > 1 ? void 0 : i ? Lt(e, t) : e, n = r.length - 1, o; n >= 0; n--)
    (o = r[n]) && (s = (i ? o(e, t, s) : o(s)) || s);
  return i && s && Ut(e, t, s), s;
};
let Q = class extends T {
  constructor() {
    super(...arguments), this.oer = null, this.language = "en";
  }
  get t() {
    return wt(this.language);
  }
  handleImageClick() {
    this.oer && this.dispatchEvent(
      new CustomEvent("card-click", {
        detail: { oer: this.oer },
        bubbles: !0,
        composed: !0
      })
    );
  }
  getLicenseUrl(r) {
    return r ? typeof r == "string" ? r : typeof r == "object" && "id" in r && typeof r.id == "string" ? r.id : null : null;
  }
  getLicenseName(r) {
    const e = this.getLicenseUrl(r);
    if (!e) return "Unknown License";
    const t = Et(e);
    return t || (e.includes("creativecommons.org") ? "Creative Commons" : "License");
  }
  render() {
    var p, l, d, g, w, fe, D, _, L, P, I, F, N;
    if (!this.oer)
      return u`
        <div class="card">
          <div class="content">
            <p class="no-data">${this.t.noDataMessage}</p>
          </div>
        </div>
      `;
    const r = ((l = (p = this.oer.extensions) == null ? void 0 : p.images) == null ? void 0 : l.small) ?? ((d = this.oer.amb) == null ? void 0 : d.image) ?? null, e = Ct(((g = this.oer.amb) == null ? void 0 : g.name) || this.t.untitledMessage), t = (w = this.oer.amb) == null ? void 0 : w.description, i = typeof t == "string" ? t : "", s = i ? kt(i) : "", n = ((fe = this.oer.amb) == null ? void 0 : fe.keywords) || [], o = Ot(n), a = (D = this.oer.amb) == null ? void 0 : D.license, c = (L = (_ = this.oer.extensions) == null ? void 0 : _.system) == null ? void 0 : L.attribution, h = (I = (P = this.oer.extensions) == null ? void 0 : P.system) == null ? void 0 : I.foreignLandingUrl;
    return u`
      <div class="card">
        <div class="thumbnail-container" @click="${this.handleImageClick}">
          ${r ? u`<img
                class="thumbnail"
                src="${r}"
                alt="${((N = (F = this.oer.extensions) == null ? void 0 : F.fileMetadata) == null ? void 0 : N.fileAlt) || e}"
                loading="lazy"
              />` : u`<div class="placeholder">📚</div>`}
        </div>
        <div class="content">
          <h3 class="title">
            ${h ? u`<a href="${h}" target="_blank" rel="noopener noreferrer"
                  >${e}</a
                >` : e}
          </h3>
          ${s ? u`<p class="description">${s}</p>` : ""}
          <div class="metadata">
            <div class="license">
              ${this.getLicenseUrl(a) ? u`${this.t.licenseLabel}
                    <a
                      href="${this.getLicenseUrl(a)}"
                      target="_blank"
                      rel="noopener noreferrer"
                      >${this.getLicenseName(a)}</a
                    >` : u`<span class="no-data">${this.t.noLicenseMessage}</span>`}
            </div>
            ${o && o.length > 0 ? u`
                  <div class="keywords">
                    ${o.map(
      (q) => u`<span class="keyword">${q}</span>`
    )}
                  </div>
                ` : ""}
            ${c ? u`<div class="attribution">${c}</div>` : ""}
          </div>
        </div>
      </div>
    `;
  }
};
Q.styles = Rt;
Pe([
  b({ type: Object })
], Q.prototype, "oer", 2);
Pe([
  b({ type: String })
], Q.prototype, "language", 2);
Q = Pe([
  he("oer-card")
], Q);
const Nt = ce`
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
`;
var jt = Object.defineProperty, Mt = Object.getOwnPropertyDescriptor, te = (r, e, t, i) => {
  for (var s = i > 1 ? void 0 : i ? Mt(e, t) : e, n = r.length - 1, o; n >= 0; n--)
    (o = r[n]) && (s = (i ? o(e, t, s) : o(s)) || s);
  return i && s && jt(e, t, s), s;
};
let U = class extends T {
  constructor() {
    super(...arguments), this.oers = [], this.loading = !1, this.error = null, this.language = "en";
  }
  get t() {
    return _t(this.language);
  }
  render() {
    return this.loading ? u`
        <div class="loading">
          <div class="loading-spinner"></div>
          <p>${this.t.loadingMessage}</p>
        </div>
      ` : this.error ? u`
        <div class="error">
          <div class="error-icon">⚠️</div>
          <p class="error-message">${this.error}</p>
        </div>
      ` : !this.oers || this.oers.length === 0 ? u`
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3 class="empty-title">${this.t.emptyTitle}</h3>
          <p class="empty-message">${this.t.emptyMessage}</p>
        </div>
      ` : u`
      <div class="list-container">
        <div class="grid">
          ${this.oers.map(
      (r) => u` <oer-card .oer="${r}" .language="${this.language}"></oer-card> `
    )}
        </div>
      </div>
    `;
  }
};
U.styles = Nt;
te([
  b({ type: Array })
], U.prototype, "oers", 2);
te([
  b({ type: Boolean })
], U.prototype, "loading", 2);
te([
  b({ type: String })
], U.prototype, "error", 2);
te([
  b({ type: String })
], U.prototype, "language", 2);
U = te([
  he("oer-list")
], U);
const Bt = /\{[^{}]+\}/g, Ht = () => {
  var r, e;
  return typeof process == "object" && Number.parseInt((e = (r = process == null ? void 0 : process.versions) == null ? void 0 : r.node) == null ? void 0 : e.substring(0, 2)) >= 18 && process.versions.undici;
};
function Dt() {
  return Math.random().toString(36).slice(2, 11);
}
function It(r) {
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
  a = Ht() ? a : void 0, e = Ie(e);
  const h = [];
  async function p(l, d) {
    const {
      baseUrl: g,
      fetch: w = i,
      Request: fe = t,
      headers: D,
      params: _ = {},
      parseAs: L = "json",
      querySerializer: P,
      bodySerializer: I = n ?? qt,
      body: F,
      ...N
    } = d || {};
    let q = e;
    g && (q = Ie(g) ?? e);
    let me = typeof s == "function" ? s : He(s);
    P && (me = typeof P == "function" ? P : He({
      ...typeof s == "object" ? s : {},
      ...P
    }));
    const be = F === void 0 ? void 0 : I(
      F,
      // Note: we declare mergeHeaders() both here and below because it’s a bit of a chicken-or-egg situation:
      // bodySerializer() needs all headers so we aren’t dropping ones set by the user, however,
      // the result of this ALSO sets the lowest-priority content-type header. So we re-merge below,
      // setting the content-type at the very beginning to be overwritten.
      // Lastly, based on the way headers work, it’s not a simple “present-or-not” check becauase null intentionally un-sets headers.
      De(o, D, _.header)
    ), Xe = De(
      // with no body, we should not to set Content-Type
      be === void 0 || // if serialized body is FormData; browser will correctly set Content-Type & boundary expression
      be instanceof FormData ? {} : {
        "Content-Type": "application/json"
      },
      o,
      D,
      _.header
    ), et = {
      redirect: "follow",
      ...c,
      ...N,
      body: be,
      headers: Xe
    };
    let re, se, S = new t(
      Wt(l, { baseUrl: q, params: _, querySerializer: me }),
      et
    ), f;
    for (const v in N)
      v in S || (S[v] = N[v]);
    if (h.length) {
      re = Dt(), se = Object.freeze({
        baseUrl: q,
        fetch: w,
        parseAs: L,
        querySerializer: me,
        bodySerializer: I
      });
      for (const v of h)
        if (v && typeof v == "object" && typeof v.onRequest == "function") {
          const y = await v.onRequest({
            request: S,
            schemaPath: l,
            params: _,
            options: se,
            id: re
          });
          if (y)
            if (y instanceof t)
              S = y;
            else if (y instanceof Response) {
              f = y;
              break;
            } else
              throw new Error("onRequest: must return new Request() or Response() when modifying the request");
        }
    }
    if (!f) {
      try {
        f = await w(S, a);
      } catch (v) {
        let y = v;
        if (h.length)
          for (let C = h.length - 1; C >= 0; C--) {
            const ie = h[C];
            if (ie && typeof ie == "object" && typeof ie.onError == "function") {
              const W = await ie.onError({
                request: S,
                error: y,
                schemaPath: l,
                params: _,
                options: se,
                id: re
              });
              if (W) {
                if (W instanceof Response) {
                  y = void 0, f = W;
                  break;
                }
                if (W instanceof Error) {
                  y = W;
                  continue;
                }
                throw new Error("onError: must return new Response() or instance of Error");
              }
            }
          }
        if (y)
          throw y;
      }
      if (h.length)
        for (let v = h.length - 1; v >= 0; v--) {
          const y = h[v];
          if (y && typeof y == "object" && typeof y.onResponse == "function") {
            const C = await y.onResponse({
              request: S,
              response: f,
              schemaPath: l,
              params: _,
              options: se,
              id: re
            });
            if (C) {
              if (!(C instanceof Response))
                throw new Error("onResponse: must return new Response() when modifying the response");
              f = C;
            }
          }
        }
    }
    if (f.status === 204 || S.method === "HEAD" || f.headers.get("Content-Length") === "0")
      return f.ok ? { data: void 0, response: f } : { error: void 0, response: f };
    if (f.ok)
      return L === "stream" ? { data: f.body, response: f } : { data: await f[L](), response: f };
    let ye = await f.text();
    try {
      ye = JSON.parse(ye);
    } catch {
    }
    return { error: ye, response: f };
  }
  return {
    request(l, d, g) {
      return p(d, { ...g, method: l.toUpperCase() });
    },
    /** Call a GET endpoint */
    GET(l, d) {
      return p(l, { ...d, method: "GET" });
    },
    /** Call a PUT endpoint */
    PUT(l, d) {
      return p(l, { ...d, method: "PUT" });
    },
    /** Call a POST endpoint */
    POST(l, d) {
      return p(l, { ...d, method: "POST" });
    },
    /** Call a DELETE endpoint */
    DELETE(l, d) {
      return p(l, { ...d, method: "DELETE" });
    },
    /** Call a OPTIONS endpoint */
    OPTIONS(l, d) {
      return p(l, { ...d, method: "OPTIONS" });
    },
    /** Call a HEAD endpoint */
    HEAD(l, d) {
      return p(l, { ...d, method: "HEAD" });
    },
    /** Call a PATCH endpoint */
    PATCH(l, d) {
      return p(l, { ...d, method: "PATCH" });
    },
    /** Call a TRACE endpoint */
    TRACE(l, d) {
      return p(l, { ...d, method: "TRACE" });
    },
    /** Register middleware */
    use(...l) {
      for (const d of l)
        if (d) {
          if (typeof d != "object" || !("onRequest" in d || "onResponse" in d || "onError" in d))
            throw new Error("Middleware must be an object with one of `onRequest()`, `onResponse() or `onError()`");
          h.push(d);
        }
    },
    /** Unregister middleware */
    eject(...l) {
      for (const d of l) {
        const g = h.indexOf(d);
        g !== -1 && h.splice(g, 1);
      }
    }
  };
}
function ue(r, e, t) {
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
    i.push(ue(a, e[o], t));
  }
  const n = i.join(s);
  return t.style === "label" || t.style === "matrix" ? `${s}${n}` : n;
}
function Qe(r, e, t) {
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
    t.style === "simple" || t.style === "label" ? s.push(t.allowReserved === !0 ? n : encodeURIComponent(n)) : s.push(ue(r, n, t));
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
              Qe(s, n, {
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
          i.push(ue(s, n, r));
        }
      }
    return i.join("&");
  };
}
function Ft(r, e) {
  let t = r;
  for (const i of r.match(Bt) ?? []) {
    let s = i.substring(1, i.length - 1), n = !1, o = "simple";
    if (s.endsWith("*") && (n = !0, s = s.substring(0, s.length - 1)), s.startsWith(".") ? (o = "label", s = s.substring(1)) : s.startsWith(";") && (o = "matrix", s = s.substring(1)), !e || e[s] === void 0 || e[s] === null)
      continue;
    const a = e[s];
    if (Array.isArray(a)) {
      t = t.replace(i, Qe(s, a, { style: o, explode: n }));
      continue;
    }
    if (typeof a == "object") {
      t = t.replace(i, Ze(s, a, { style: o, explode: n }));
      continue;
    }
    if (o === "matrix") {
      t = t.replace(i, `;${ue(s, a)}`);
      continue;
    }
    t = t.replace(i, o === "label" ? `.${encodeURIComponent(a)}` : encodeURIComponent(a));
  }
  return t;
}
function qt(r, e) {
  return r instanceof FormData ? r : e && (e.get instanceof Function ? e.get("Content-Type") ?? e.get("content-type") : e["Content-Type"] ?? e["content-type"]) === "application/x-www-form-urlencoded" ? new URLSearchParams(r).toString() : JSON.stringify(r);
}
function Wt(r, e) {
  var s;
  let t = `${e.baseUrl}${r}`;
  (s = e.params) != null && s.path && (t = Ft(t, e.params.path));
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
function Fe(r, e) {
  return It({
    baseUrl: r.replace(/\/$/, ""),
    // Remove trailing slash
    headers: e == null ? void 0 : e.headers,
    fetch: e == null ? void 0 : e.fetch
  });
}
const Yt = ce`
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
`;
var Vt = Object.defineProperty, Kt = Object.getOwnPropertyDescriptor, $ = (r, e, t, i) => {
  for (var s = i > 1 ? void 0 : i ? Kt(e, t) : e, n = r.length - 1, o; n >= 0; n--)
    (o = r[n]) && (s = (i ? o(e, t, s) : o(s)) || s);
  return i && s && Vt(e, t, s), s;
};
let x = class extends T {
  constructor() {
    super(...arguments), this.apiUrl = "http://localhost:3000", this.language = "en", this.showTypeFilter = !0, this.pageSize = 20, this.availableSources = [], this.showSourceFilter = !0, this.client = null, this.searchParams = {
      page: 1,
      source: ne
    }, this.loading = !1, this.error = null, this.advancedFiltersExpanded = !1, this.handleSlottedPageChange = (r) => {
      const e = r;
      r.stopPropagation(), this.searchParams = { ...this.searchParams, page: e.detail.page }, this.performSearch();
    };
  }
  get t() {
    return St(this.language);
  }
  connectedCallback() {
    super.connectedCallback(), this.client = Fe(this.apiUrl), this.searchParams = {
      ...this.searchParams,
      pageSize: this.pageSize
    }, this.lockedType && (this.searchParams = {
      ...this.searchParams,
      type: this.lockedType
    }), this.lockedSource && (this.searchParams = {
      ...this.searchParams,
      source: this.lockedSource
    }), this.addEventListener("page-change", this.handleSlottedPageChange);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this.removeEventListener("page-change", this.handleSlottedPageChange);
  }
  updated(r) {
    if (super.updated(r), r.has("apiUrl") && (this.client = Fe(this.apiUrl)), r.has("pageSize") && (this.searchParams = {
      ...this.searchParams,
      pageSize: this.pageSize
    }), r.has("lockedType"))
      if (this.lockedType)
        this.searchParams = {
          ...this.searchParams,
          type: this.lockedType
        };
      else {
        const { type: e, ...t } = this.searchParams;
        this.searchParams = t;
      }
    r.has("lockedSource") && (this.lockedSource ? this.searchParams = {
      ...this.searchParams,
      source: this.lockedSource
    } : this.searchParams = {
      ...this.searchParams,
      source: ne
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
      pageSize: this.pageSize,
      source: this.lockedSource || ne
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
  render() {
    return u`
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
                .value="${this.searchParams.searchTerm || ""}"
                @input="${this.handleInputChange("searchTerm")}"
                required
              />
            </div>

            ${this.showTypeFilter && !this.lockedType ? u`
                  <div class="form-group">
                    <label for="type">${this.t.typeLabel}</label>
                    <select
                      id="type"
                      .value="${this.searchParams.type || ""}"
                      @change="${this.handleInputChange("type")}"
                    >
                      <option value="">${this.t.anyOptionText}</option>
                      ${Pt.map(
      (r) => u` <option value="${r.value}">${r.label}</option> `
    )}
                    </select>
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
                  <label for="language">${this.t.languageLabel}</label>
                  <select
                    id="language"
                    .value="${this.searchParams.language || ""}"
                    @change="${this.handleInputChange("language")}"
                  >
                    <option value="">${this.t.anyOptionText}</option>
                    ${Tt.map(
      (r) => u` <option value="${r.code}">${r.label}</option> `
    )}
                  </select>
                </div>

                <div class="form-group">
                  <label for="license">${this.t.licenseLabel}</label>
                  <select
                    id="license"
                    .value="${this.searchParams.license || ""}"
                    @change="${this.handleInputChange("license")}"
                  >
                    <option value="">${this.t.anyOptionText}</option>
                    ${Je.map(
      (r) => u`
                        <option value="${r.uri}">${r.shortName}</option>
                      `
    )}
                  </select>
                </div>
              </div>

              ${this.showSourceFilter && !this.lockedSource && this.availableSources.length > 0 ? u`
                    <div class="form-group">
                      <label for="source">${this.t.sourceLabel}</label>
                      <select
                        id="source"
                        .value="${this.searchParams.source || ne}"
                        @change="${this.handleInputChange("source")}"
                      >
                        ${this.availableSources.map(
      (r) => u`
                            <option value="${r.value}">${r.label}</option>
                          `
    )}
                      </select>
                    </div>
                  ` : ""}
            </div>

            <div class="button-group">
              <button type="submit" class="search-button" ?disabled="${this.loading}">
                ${this.loading ? this.t.searchingText : this.t.searchButtonText}
              </button>
              <button type="button" class="clear-button" @click="${this.handleClear}">
                ${this.t.clearButtonText}
              </button>
            </div>

            ${this.error ? u`<div class="error-message">${this.error}</div>` : ""}
          </form>
        </div>
        <div class="slot-container">
          <slot></slot>
        </div>
      </div>
    `;
  }
};
x.styles = Yt;
$([
  b({ type: String, attribute: "api-url" })
], x.prototype, "apiUrl", 2);
$([
  b({ type: String })
], x.prototype, "language", 2);
$([
  b({ type: String, attribute: "locked-type" })
], x.prototype, "lockedType", 2);
$([
  b({ type: Boolean, attribute: "show-type-filter" })
], x.prototype, "showTypeFilter", 2);
$([
  b({ type: Number, attribute: "page-size" })
], x.prototype, "pageSize", 2);
$([
  b({ type: Array, attribute: "available-sources" })
], x.prototype, "availableSources", 2);
$([
  b({ type: String, attribute: "locked-source" })
], x.prototype, "lockedSource", 2);
$([
  b({ type: Boolean, attribute: "show-source-filter" })
], x.prototype, "showSourceFilter", 2);
$([
  ee()
], x.prototype, "client", 2);
$([
  ee()
], x.prototype, "searchParams", 2);
$([
  ee()
], x.prototype, "loading", 2);
$([
  ee()
], x.prototype, "error", 2);
$([
  ee()
], x.prototype, "advancedFiltersExpanded", 2);
x = $([
  he("oer-search")
], x);
const Gt = ce`
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
`;
var Jt = Object.defineProperty, Zt = Object.getOwnPropertyDescriptor, ge = (r, e, t, i) => {
  for (var s = i > 1 ? void 0 : i ? Zt(e, t) : e, n = r.length - 1, o; n >= 0; n--)
    (o = r[n]) && (s = (i ? o(e, t, s) : o(s)) || s);
  return i && s && Jt(e, t, s), s;
};
let H = class extends T {
  constructor() {
    super(...arguments), this.metadata = null, this.loading = !1, this.language = "en";
  }
  get t() {
    return At(this.language);
  }
  render() {
    return this.metadata ? u`
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
            ?disabled="${this.metadata.page === 1 || this.loading}"
            @click="${() => this.handlePageChange(1)}"
          >
            ${this.t.firstButtonText}
          </button>
          <button
            type="button"
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
            type="button"
            class="page-button"
            ?disabled="${this.metadata.page === this.metadata.totalPages || this.loading}"
            @click="${() => this.handlePageChange(this.metadata.page + 1)}"
          >
            ${this.t.nextButtonText}
          </button>
          <button
            type="button"
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
    this.dispatchEvent(
      new CustomEvent("page-change", {
        detail: { page: r },
        bubbles: !0,
        composed: !0
      })
    );
  }
};
H.styles = Gt;
ge([
  b({ type: Object })
], H.prototype, "metadata", 2);
ge([
  b({ type: Boolean })
], H.prototype, "loading", 2);
ge([
  b({ type: String })
], H.prototype, "language", 2);
H = ge([
  he("oer-pagination")
], H);
const er = "0.0.1";
export {
  Q as OerCardElement,
  U as OerListElement,
  x as OerSearchElement,
  H as PaginationElement,
  er as VERSION,
  Fe as createOerClient,
  wt as getCardTranslations,
  _t as getListTranslations,
  At as getPaginationTranslations,
  St as getSearchTranslations,
  pe as getTranslations,
  Ot as shortenLabels,
  kt as truncateContent,
  zt as truncateLabel,
  Te as truncateText,
  Ct as truncateTitle
};
