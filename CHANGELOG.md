# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [5.0.2] — 2026-04-26

### Added

#### CoreEngine
- `onInject(callback)` — register an engine-level callback fired after every injection made by this instance; returns `this` for chaining
- `_fireInject(el, key, runCallback?)` — protected method that dispatches callbacks in order: `run()`-level first, engine-level second; supports both sync and async callbacks

#### ScriptEngine
- `onInject` option on `run()` — callback fired after this specific injection, receives `(el: HTMLScriptElement, key: string)`

#### HtmlEngine
- `onInject` option on `run()` — callback fired after this specific injection, receives `(el: HTMLDivElement, key: string)`

#### CSSEngine
- `onInject` option on `run()` — callback fired after this specific injection, receives `(el: HTMLStyleElement, key: string)`

#### Types
- Exported `InjectCallback<T extends Element>` generic type — `(el: T, key: string) => void | Promise<void>`

### Notes
- Callback execution order is guaranteed: `run()`-level callback fires before engine-level callback
- All callbacks accept async functions — xeval `await`s them internally via `void`
- On `ScriptEngine`, the callback fires after the script has already executed — useful for tracking, analytics, or key storage

---

## [5.0.1] — 2026-04-26

### Added

#### Xeval
- Source cache on `loadFrom()` — remote files are cached by URL and shared across all calls within the same session
- `ttl` option on `loadFrom()` — cache expiry in milliseconds; omit for permanent cache
- Stale cache fallback — if a fetch fails and an expired cache entry exists, xeval serves it with a warning instead of throwing
- `clearCache(url?)` — invalidate a single URL or the entire cache
- `isCached(url)` — returns `true` if the URL is cached and not expired
- `cacheInfo(url)` — returns `{ cachedAt, ttl, type }` metadata or `null` if not cached
- `#buildEngine()` — private helper extracted to avoid duplicating engine construction logic

#### Internal
- Cache storage uses `Map<string, CacheEntry>` where `CacheEntry = { source, type, cachedAt, ttl }`
- Cache is stored on the `Xeval` singleton — persists across the full page session

---

## [5.0.0] — 2026-04-26

> First public release of xeval. Previous iterations (v1–v4) were internal development steps documented below for historical context.

### Added

#### CoreEngine
- Abstract base class shared by all engines
- `#source` — private field holding the raw source string
- `#keyRegistry` — `Map<string, Element>` tracking every injection made by the instance
- `_interpolate(template, context)` — `$$key` placeholder engine supporting primitives, strings, numbers, booleans, objects (auto JSON.stringify'd), and functions (serialized as arrow `const` declarations)
- `_stamp(el)` — generates a UUID via `crypto.randomUUID()`, sets `data-xeval-key` on the element, registers it in the key registry; returns the key
- `_getByKey(key)` — protected internal lookup by key
- `getByKey(key)` — public API to retrieve an injected element by its unique key
- `cleanupOne(key)` — removes a single injected element from the DOM and from the registry; returns `boolean`
- `cleanup()` — removes all injected elements from the DOM and clears the registry
- `render(options?)` — returns the interpolated source as a string without touching the DOM
- `rawSource` — getter returning the original uninterpolated source
- `lastKey` — getter returning the key of the last injection
- `lastInjected` — getter returning the last injected DOM element
- `keys` — getter returning all injection keys in insertion order
- `_source` — protected getter exposing the private source to subclasses

#### ScriptEngine
- `run({ context, module, id, target })` — interpolates and injects a `<script>` element; stamps it with `data-xeval-key` before appending
- `inject()` — alias for `run()`
- `module` option — sets `type="module"` on the script element
- `target` option — CSS selector or `Element`, defaults to `document.body`
- `update()` intentionally absent — modifying `<script>` `textContent` post-execution has no browser effect; use `cleanup()` + `run()` instead

#### HtmlEngine
- `run({ context, target, position, safe, id, class })` — interpolates and injects HTML wrapped in a `<div>`; stamps with `data-xeval-key`
- `inject()` — alias for `run()`
- `update({ context, key, id, safe })` — updates content of an already-injected element; resolves target by `key` → `id` → `lastInjected`
- `position` option — controls insertion: `append` (default), `prepend`, `before`, `after`, `replace`
- `safe` option — uses `textContent` instead of `innerHTML` to prevent HTML parsing of untrusted content
- `target` option — CSS selector or `Element`, defaults to `document.body`
- `_applyContent(el, content, safe)` — protected helper to apply content respecting safe mode
- `_insert(el, container, position)` — protected helper routing to the correct DOM insertion method

#### CSSEngine
- `run({ context, target, id, media })` — interpolates and injects a `<style>` element; stamps with `data-xeval-key`
- `inject()` — alias for `run()`
- `update({ context, key, id })` — updates `textContent` of an already-injected `<style>`; resolves target by `key` → `id` → `lastInjected`
- `media` option — sets the `media` attribute on the `<style>` element
- `target` option — CSS selector or `Element`, defaults to `document.head`

#### Xeval (singleton entry point)
- `prepare(source)` → `ScriptEngine`
- `prepareHTML(source)` → `HtmlEngine`
- `prepareCSS(source)` → `CSSEngine`
- `loadFrom(url, options?)` — fetches a remote file and returns the appropriate engine
    - Auto-detects type from extension: `.js`, `.mjs` → `ScriptEngine` / `.html`, `.htm` → `HtmlEngine` / `.css` → `CSSEngine`
    - `{ type: 'js' | 'html' | 'css' }` — force type when extension is absent or ambiguous
    - Throws a descriptive error if type cannot be determined

#### TypeScript
- Full rewrite in TypeScript targeting `ES2020` with `ES2022` lib
- `strict: true` across the entire codebase
- All public types exported: `Context`, `ContextValue`, `XevalFileType`, `InsertPosition`, `ScriptRunOptions`, `HtmlRunOptions`, `HtmlUpdateOptions`, `CssRunOptions`, `CssUpdateOptions`, `LoadFromOptions`, `RenderOptions`
- `CoreEngine`, `ScriptEngine`, `HtmlEngine`, `CSSEngine` all exported as named exports
- Declaration file `dist/xeval.d.ts` generated automatically by `tsc`

#### Build
- Rollup config producing three builds: `dist/xeval.esm.js`, `dist/xeval.cjs.js`, `dist/xeval.min.js`
- `package.json` `exports` field with `import`, `require`, and `types` conditions
- `prepublishOnly` script runs `typecheck` then `build` — broken types block publishing

#### Utilities (internal)
- `generateKey()` — thin wrapper around `crypto.randomUUID()`
- `detectTypeFromUrl(url)` — strips query strings and hash fragments before matching extension
- `resolveTarget(target, fallback)` — resolves CSS selector or Element; logs a warning and falls back gracefully if target is not found; fallback is typed per engine (`document.head` for CSS, `document.body` for others)
- `XEVAL_TAG` constant used as prefix on all console messages for easy filtering
- `XEVAL_KEY_ATTR` constant — `'data-xeval-key'`

---

## Historical context (unpublished)

These versions were internal development iterations and were never published to npm. They are documented here for transparency.

---

### [4.0.0-internal]

#### Added
- `CSSEngine` — injects CSS via `<style>` element with `$$placeholder` support
- `prepareCSS(source)` entry point on `Xeval`
- `media` option on `CSSEngine.run()`
- `update()` on `HtmlEngine` — modify injected HTML without re-injecting
- `update()` on `CSSEngine` — modify injected `<style>` without re-injecting
- `loadFrom()` extended to support `.css` files → returns `CSSEngine`
- `resolveTarget()` refactored to accept a `fallback` parameter — `document.head` for CSS, `document.body` for others

---

### [3.0.0-internal]

#### Added
- `CoreEngine` abstract base class — shared interpolation, registry, cleanup, render logic
- `HtmlEngine` — injects HTML with `innerHTML` / `textContent` support
- `prepareHTML(source)` entry point on `Xeval`
- `position` option on `HtmlEngine.run()` — `append`, `prepend`, `before`, `after`, `replace`
- `safe` option on `HtmlEngine.run()` — uses `textContent` to prevent HTML parsing
- URL type auto-detection in `loadFrom()` from file extension
- `loadFrom()` returns `HtmlEngine` for `.html` / `.htm` files

#### Changed
- `ScriptEngine` and `HtmlEngine` now both extend `CoreEngine`

---

### [2.0.0-internal]

#### Fixed
- `fetch()` method renamed to `loadFrom()` — the original name shadowed the global `fetch` API causing infinite recursion
- `templateEngine` second `.replace()` call missing its second argument — placeholders were silently dropped instead of being replaced
- Script injection simplified — removed unnecessary `<template>` + `cloneNode` pattern, replaced with direct `createElement` + `appendChild`

#### Added
- `render(options?)` — preview interpolated source without DOM injection
- `cleanup()` — remove all injected scripts from the DOM
- `module` option on `run()` — inject as `type="module"`
- `rawSource` getter — access original source before interpolation

#### Changed
- `fetch()` → `loadFrom()` to avoid conflict with global `fetch`
- `#code` → `#source` — more accurate name for the stored string
- `#injectedScripts` → `#scriptRegistry` — it is a registry, not just a list
- `#templateEngine` → `#interpolate` — describes the actual operation
- `text` parameter → `template` — more semantically accurate
- `keysRegexp` → `placeholderRegexp` — targets placeholders, not keys
- `v` → `value` — non-descriptive single-letter variable eliminated
- `body` (fn serialization) → `serializedFn` — "body" implied only the function body
- `isModule` → `asModule` — it is a rendering option, not a state flag
- `resolvedCode` → `interpolatedCode` — "resolved" was vague
- `get source` → `get rawSource` — distinguishes raw source from `render()` output

---

### [1.0.0-internal]

#### Added
- `Xeval` class with `prepare(code)` and `fetch(path)` methods
- `ScriptEngine` class with `run(p)`, `inject(p)`, `runAsync(p)`, `injectAsync(p)`
- `$$key` placeholder engine inside `#templateEngine(text, context)`
- Script injection via `<template>` + `cloneNode` + `document.body.appendChild`
- Singleton export `export default new Xeval()`

---

[5.0.2]: https://github.com/ThePrinceTrueface/xeval/compare/v5.0.1...v5.0.2
[5.0.1]: https://github.com/ThePrinceTrueface/xeval/compare/v5.0.0...v5.0.1
[5.0.0]: https://github.com/ThePrinceTrueface/xeval/releases/tag/v5.0.0