<div align="center">

<img src="https://i.ibb.co/Gvyymj8s/wmremove-transformed-1.png" alt="xeval banner" width="100%" />

# xeval

**Inject JavaScript, HTML & CSS dynamically into the DOM — with a built-in template engine, smart caching, and full TypeScript support.**

[![npm version](https://img.shields.io/npm/v/xeval?color=6c47ff&style=flat-square)](https://npmjs.com/package/xeval)
[![bundle size](https://img.shields.io/bundlephobia/minzip/xeval?color=6c47ff&style=flat-square)](https://bundlephobia.com/package/xeval)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-6c47ff?style=flat-square)](https://www.typescriptlang.org/)
[![license](https://img.shields.io/npm/l/xeval?color=6c47ff&style=flat-square)](./LICENSE)
[![maintained by ebinasoft](https://img.shields.io/badge/maintained%20by-ebinasoft-6c47ff?style=flat-square)](https://github.com/ebinasoft)

<br/>

[**Get Started**](#-installation) · [**API Reference**](#-api-reference) · [**Examples**](#-real-world-examples) · [**Contributing**](#-contributing)

<br/>

</div>

---

## Why xeval?

Most apps eventually need to run or inject dynamic content at runtime — a plugin loaded from a server, a theme switched by the user, a script that depends on runtime config. The native options (`eval`, `innerHTML`, manual script tags) are verbose, unsafe by default, and offer no structure.

**xeval gives you a clean, typed, chainable API** to do all of this — without a bundler, without a framework, without boilerplate.

```ts
import xeval from 'xeval'

// Inject a dynamic script
xeval.prepare(`console.log("Hello, $$name!")`)
     .run({ context: { name: 'world' } })

// Inject HTML with a template
xeval.prepareHTML(`<h1 class="title">$$heading</h1>`)
     .onInject((el, key) => el.classList.add('visible'))
     .run({ target: '#app', context: { heading: 'Welcome' } })

// Inject CSS with live update
const theme = xeval.prepareCSS(`body { background: $$bg; color: $$fg; }`)
theme.run({ context: { bg: '#0f0f0f', fg: '#ffffff' }, id: 'app-theme' })
theme.update({ context: { bg: '#ffffff', fg: '#0f0f0f' } })
```

---

## ✨ Features

- 🧩 **Three engines** — inject JS, HTML, and CSS with a unified API
- 🔑 **Unique injection keys** — every element gets a `data-xeval-key` (UUID) for precise targeting
- 🎯 **Flexible insertion** — `append`, `prepend`, `before`, `after`, or `replace`
- 🔄 **Live update** — modify injected HTML and CSS without re-injecting
- 📦 **Smart cache** — `loadFrom()` caches remote files with optional TTL and stale fallback
- 🔔 **Dual callbacks** — `onInject` at engine level and per `run()` call
- 🔒 **Safe mode** — use `textContent` instead of `innerHTML` for untrusted content
- 🧹 **Clean DOM** — `cleanup()` and `cleanupOne(key)` remove exactly what was injected
- 💎 **Full TypeScript** — strict types, exported interfaces, autocompletion everywhere
- 🪶 **Zero dependencies** — browser-native APIs only

---

## 📦 Installation

```bash
npm install xeval
```

```bash
yarn add xeval
```

```bash
pnpm add xeval
```

**Via CDN** — no install needed:

```html
<script type="module">
  import xeval from 'https://cdn.jsdelivr.net/npm/xeval/dist/xeval.esm.js'
</script>
```

---

## 🚀 Quick Start

```ts
import xeval from 'xeval'

// ── JS ────────────────────────────────────────
xeval.prepare(`
  const user = $$user
  document.title = "Welcome, " + user.name
`).run({
  context: { user: { name: 'Alice', role: 'admin' } }
})

// ── HTML ──────────────────────────────────────
const card = xeval.prepareHTML(`
  <div class="card">
    <h2>$$title</h2>
    <p>$$description</p>
  </div>
`)

const el = card.run({
  target: '#container',
  position: 'append',
  context: { title: 'Hello', description: 'xeval is awesome' },
  onInject: (el, key) => console.log('Injected with key:', key)
})

// Update it later without re-injecting
card.update({ context: { title: 'Updated!', description: 'Still the same element.' } })

// ── CSS ───────────────────────────────────────
const theme = xeval.prepareCSS(`
  :root {
    --color-bg: $$bg;
    --color-text: $$text;
    --font-size: $$size;
  }
`)

theme.run({ context: { bg: '#1a1a2e', text: '#eee', size: '16px' }, id: 'theme' })

// Switch theme on the fly
theme.update({ context: { bg: '#ffffff', text: '#111', size: '16px' } })

// ── Remote files ──────────────────────────────
const engine = await xeval.loadFrom('/plugins/analytics.js')
engine.run({ context: { trackingId: 'UA-XXXXX' } })
```

---

## 📖 API Reference

### `xeval` — Entry Point

| Method | Returns | Description |
|---|---|---|
| `prepare(source)` | `ScriptEngine` | Create a JS engine from a string |
| `prepareHTML(source)` | `HtmlEngine` | Create an HTML engine from a string |
| `prepareCSS(source)` | `CSSEngine` | Create a CSS engine from a string |
| `loadFrom(url, options?)` | `Promise<Engine>` | Fetch a remote file and return the right engine |
| `clearCache(url?)` | `void` | Clear one URL or the entire cache |
| `isCached(url)` | `boolean` | Check if a URL is cached and not expired |
| `cacheInfo(url)` | `object \| null` | Get cache metadata for a URL |

---

### `CoreEngine` — Shared API

All engines inherit these methods and properties.

| Member | Type | Description |
|---|---|---|
| `onInject(callback)` | `this` | Register an engine-level callback — chainable |
| `getByKey(key)` | `Element \| null` | Retrieve an injected element by its key |
| `cleanupOne(key)` | `boolean` | Remove a single injection from the DOM |
| `cleanup()` | `void` | Remove all injections from the DOM |
| `render(options?)` | `string` | Preview interpolated source without injecting |
| `rawSource` | `string` | The original uninterpolated source |
| `lastKey` | `string \| null` | Key of the last injection |
| `lastInjected` | `Element \| null` | Last injected element |
| `keys` | `string[]` | All injection keys in order |

---

### `ScriptEngine`

```ts
engine.run(options?: ScriptRunOptions): HTMLScriptElement
engine.inject(options?: ScriptRunOptions): HTMLScriptElement  // alias
```

| Option | Type | Default | Description |
|---|---|---|---|
| `context` | `Context` | — | Values for `$$placeholder` interpolation |
| `target` | `string \| Element` | `document.body` | Where to append the script |
| `module` | `boolean` | `false` | Inject as `type="module"` |
| `id` | `string` | — | Set an `id` on the script element |
| `onInject` | `InjectCallback` | — | Callback fired after this injection |

> **Note:** `update()` is not available on `ScriptEngine` — once a script runs, its DOM element is inert. Use `cleanup()` + `run()` to re-execute.

---

### `HtmlEngine`

```ts
engine.run(options?: HtmlRunOptions): HTMLDivElement
engine.inject(options?: HtmlRunOptions): HTMLDivElement          // alias
engine.update(options?: HtmlUpdateOptions): Element | null
```

**`run()` options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `context` | `Context` | — | Values for `$$placeholder` interpolation |
| `target` | `string \| Element` | `document.body` | Insertion container |
| `position` | `InsertPosition` | `'append'` | Where to insert relative to target |
| `safe` | `boolean` | `false` | Use `textContent` instead of `innerHTML` |
| `id` | `string` | — | Set an `id` on the wrapper element |
| `class` | `string` | — | Set a `class` on the wrapper element |
| `onInject` | `InjectCallback` | — | Callback fired after this injection |

**`update()` options:**

| Option | Type | Description |
|---|---|---|
| `context` | `Context` | New values for interpolation |
| `key` | `string` | Target a specific injection by key |
| `id` | `string` | Target a specific injection by id |
| `safe` | `boolean` | Use `textContent` instead of `innerHTML` |

**`InsertPosition` values:**

| Value | Behavior |
|---|---|
| `'append'` | Add as last child of target *(default)* |
| `'prepend'` | Add as first child of target |
| `'before'` | Insert before the target element |
| `'after'` | Insert after the target element |
| `'replace'` | Replace target's content entirely |

---

### `CSSEngine`

```ts
engine.run(options?: CssRunOptions): HTMLStyleElement
engine.inject(options?: CssRunOptions): HTMLStyleElement        // alias
engine.update(options?: CssUpdateOptions): HTMLStyleElement | null
```

**`run()` options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `context` | `Context` | — | Values for `$$placeholder` interpolation |
| `target` | `string \| Element` | `document.head` | Where to append the style element |
| `id` | `string` | — | Set an `id` on the style element |
| `media` | `string` | — | Set the `media` attribute (e.g. `'print'`, `'screen'`) |
| `onInject` | `InjectCallback` | — | Callback fired after this injection |

---

### Template Engine — `$$placeholders`

xeval's template engine replaces `$$key` placeholders in your source with values from the `context` object.

```ts
// Primitives — replaced as-is
xeval.prepare(`const x = $$value`).run({ context: { value: 42 } })
// → const x = 42

// Strings — wrap in quotes yourself for JS, xeval handles HTML/CSS
xeval.prepare(`const lang = "$$lang"`).run({ context: { lang: 'fr' } })
// → const lang = "fr"

// Objects & Arrays — automatically JSON.stringify'd
xeval.prepare(`const user = $$user`).run({
  context: { user: { id: 1, name: 'Alice' } }
})
// → const user = {"id":1,"name":"Alice"}

// Functions — serialized as arrow function const declarations
xeval.prepare(`$$greet\ngreet()`).run({
  context: { greet: function() { alert('hi') } }
})
// → const greet = () => { alert('hi') }
//   greet()

// Unknown keys — left untouched
xeval.prepare(`const x = $$unknown`).run({ context: {} })
// → const x = $$unknown
```

---

### `loadFrom()` — Remote files with cache

```ts
// Auto-detect type from extension
const jsEngine   = await xeval.loadFrom('/plugin.js')
const htmlEngine = await xeval.loadFrom('/template.html')
const cssEngine  = await xeval.loadFrom('/theme.css')

// Force type when URL has no extension
const engine = await xeval.loadFrom('/api/template', { type: 'html' })

// Set a cache TTL (milliseconds)
const engine2 = await xeval.loadFrom('/theme.css', { ttl: 5 * 60 * 1000 })

// Cache helpers
xeval.isCached('/plugin.js')     // → true | false
xeval.cacheInfo('/plugin.js')    // → { cachedAt, ttl, type }
xeval.clearCache('/plugin.js')   // clear one URL
xeval.clearCache()               // clear everything
```

> If a fetch fails and a stale cache entry exists, xeval automatically serves it as a fallback with a warning — keeping your app resilient to network hiccups.

---

### `onInject` — Dual callback system

```ts
// Engine-level — fires on every run() call, chainable
const engine = xeval.prepareHTML(`<p>$$text</p>`)
  .onInject((el, key) => {
    el.classList.add('fade-in')
    console.log('Engine callback — key:', key)
  })

// run()-level — fires only for this specific injection
engine.run({
  context: { text: 'Hello' },
  onInject: (el, key) => console.log('Run callback — key:', key)
})

// Callback order:
// 1. run() callback  →  "Run callback — key: abc-123..."
// 2. engine callback →  "Engine callback — key: abc-123..."
```

---

## 🌍 Real-world Examples

### Plugin system

```ts
const plugins = ['/plugins/logger.js', '/plugins/analytics.js', '/plugins/chat.js']

for (const url of plugins) {
  const engine = await xeval.loadFrom(url)
  engine.run({ context: { env: 'production' } })
}
```

### Live theme switcher

```ts
const theme = xeval.prepareCSS(`
  body {
    --bg: $$bg;
    --text: $$text;
    --accent: $$accent;
  }
`)

theme.run({ id: 'app-theme', context: { bg: '#fff', text: '#111', accent: '#6c47ff' } })

document.querySelector('#dark-mode').addEventListener('change', (e) => {
  theme.update({
    context: e.target.checked
      ? { bg: '#0f0f0f', text: '#eee', accent: '#a78bfa' }
      : { bg: '#fff',    text: '#111', accent: '#6c47ff' }
  })
})
```

### Consent-gated third-party scripts

```ts
cookieBanner.onAccept(async (categories) => {
  if (categories.analytics) {
    const engine = await xeval.loadFrom('/vendors/gtag.js')
    engine.run({ context: { trackingId: 'UA-XXXXX' } })
  }
  if (categories.support) {
    const engine = await xeval.loadFrom('/vendors/intercom.js')
    engine.run({ context: { appId: 'APP_ID' } })
  }
})
```

### Reversible debug mode

```ts
const debug = xeval.prepare(`
  window.__debug = true
  console.log('[debug] mode activated')
  document.body.dataset.debug = 'true'
`)

document.querySelector('#debug-toggle').addEventListener('change', (e) => {
  if (e.target.checked) {
    debug.run({ id: 'debug-mode' })
  } else {
    debug.cleanup()
  }
})
```

### Dynamic component rendering

```ts
const userCard = xeval.prepareHTML(`
  <div class="user-card" data-role="$$role">
    <img src="$$avatar" alt="$$name" />
    <h3>$$name</h3>
    <span class="badge">$$role</span>
  </div>
`)

// Render all users
users.forEach(user => {
  userCard.run({
    target: '#user-list',
    position: 'append',
    context: user,
    onInject: (el, key) => {
      el.addEventListener('click', () => openProfile(user.id))
    }
  })
})

// Clean up when navigating away
window.addEventListener('popstate', () => userCard.cleanup())
```

---

## 🏗️ Architecture

```
Xeval (singleton)
├── prepare(source)        → ScriptEngine
├── prepareHTML(source)    → HtmlEngine
├── prepareCSS(source)     → CSSEngine
└── loadFrom(url, options) → ScriptEngine | HtmlEngine | CSSEngine
                             (with built-in cache)

CoreEngine  (abstract base class)
├── _interpolate()         Template engine — $$key substitution
├── _stamp()               Generates & assigns data-xeval-key (UUID)
├── _fireInject()          Dispatches run() then engine callbacks
├── onInject()             Register engine-level callback (chainable)
├── getByKey()             Retrieve element by key
├── cleanupOne()           Remove one injection by key
├── cleanup()              Remove all injections
├── render()               Preview without DOM injection
├── rawSource              Original source string
├── lastKey / lastInjected / keys
│
├── ScriptEngine  → run({ context, module, id, target, onInject })
├── HtmlEngine    → run({ context, target, position, safe, id, class, onInject })
│                   update({ context, key, id, safe })
└── CSSEngine     → run({ context, target, id, media, onInject })
                    update({ context, key, id })
```

---

## 📁 Project Structure

```
xeval/
├── src/
│   └── xeval.ts              ← single source file
├── dist/
│   ├── xeval.esm.js          ← ES Module build
│   ├── xeval.cjs.js          ← CommonJS build
│   ├── xeval.min.js          ← Minified CDN build
│   └── xeval.d.ts            ← TypeScript declarations
├── tests/
│   ├── core.test.ts
│   ├── script.test.ts
│   ├── html.test.ts
│   └── css.test.ts
├── CHANGELOG.md
├── README.md
└── package.json
```

---

## 🤝 Contributing

xeval is a passion project by **[@ThePrinceTrueface](https://github.com/ThePrinceTrueface)**, maintained under the **[ebinasoft](https://github.com/ebinasoft)** organization. Contributions, ideas, and feedback are genuinely welcome.

### How to contribute

```bash
# 1. Fork the repo and clone it
git clone https://github.com/YOUR_USERNAME/xeval.git
cd xeval

# 2. Install dependencies
npm install

# 3. Start dev mode (watch + rebuild on save)
npm run dev

# 4. Typecheck
npm run typecheck
```

### Commit convention

This project uses **[Conventional Commits](https://www.conventionalcommits.org/)**:

```bash
feat(html): add onInject callback option
fix(core): getByKey returns null instead of undefined
refactor(cache): extract buildEngine as private method
docs: update loadFrom examples in README
```

Types: `feat` · `fix` · `refactor` · `docs` · `chore` · `test` · `perf`

### What we'd love help with

- 🧪 **Tests** — Vitest unit tests for all engines
- 📖 **Examples** — real-world use cases in `docs/examples/`
- 🐛 **Bug reports** — open an issue with a minimal reproduction
- 💡 **Ideas** — open a discussion before implementing big features

---

## 🛡️ Security

xeval injects and executes arbitrary content into the page context. A few guidelines:

- **Never pass untrusted user input** directly as script source
- Use `safe: true` on `HtmlEngine` when injecting user-generated content
- For full isolation, consider an `<iframe sandbox>` as an alternative

---

## 📄 License

MIT © [ThePrinceTrueface](https://github.com/ThePrinceTrueface) — [ebinasoft](https://github.com/ebinasoft)

---

<div align="center">

**If xeval saved you time or sparked an idea, a ⭐ on GitHub means the world.**

Made with passion by [@ThePrinceTrueface](https://github.com/ThePrinceTrueface) · [ebinasoft](https://github.com/ebinasoft)

</div>