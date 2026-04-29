# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [5.3.0] — 2026-04-29

### Added

**HtmlEngine**
- Automatic unwrapping of single-element HTML — when injected HTML contains a single root element (e.g., `<button>`), it is now injected directly without a wrapper `<div>`, resulting in cleaner DOM structure
- `_isSingleElementHTML(html)` — protected method that validates HTML structure and detects if it's a single root element using regex pattern matching and DOM verification

### Changed

**HtmlEngine**
- `run()` method now returns `Element` instead of `HTMLDivElement` — reflects the actual return type (can be any element, not just div)
- `inject()` method now returns `Element` instead of `HTMLDivElement` — maintains consistency with `run()`

**Types**
- `HtmlRunOptions.onInject` now accepts `InjectCallback<Element>` instead of `InjectCallback<HTMLDivElement>` — supports all element types consistently

### Behavior

- **Single element injection**: `<button>Click</button>` → directly injected as `<button>Click</button>` (no wrapper div)
- **Multiple elements**: `<p>A</p><p>B</p>` → wrapped in `<div>` for consistency (unchanged behavior)
- **Attributes application**: `id` and `class` attributes now applied directly to the extracted element, not to a wrapper

### Backward Compatibility

✅ Fully backward compatible — existing code continues to work without modifications

---


### Added

**CoreEngine**
- `onInject(callback)` — register an engine-level callback fired after every injection made by this instance; returns this for chaining
- `_fireInject(el, key, runCallback?)` — protected method that dispatches callbacks in order: run()-level first, engine-level second; supports both sync and async callbacks

**ScriptEngine**
- `onInject` option on `run()` — callback fired after this specific injection, receives `(el: HTMLScriptElement, key: string)`

**HtmlEngine**
- `onInject` option on `run()` — callback fired after this specific injection, receives `(el: HTMLDivElement, key: string)`

**CSSEngine**
- `onInject` option on `run()` — callback fired after this specific injection, receives `(el: HTMLStyleElement, key: string)`

**Types**
- Exported `InjectCallback<T extends Element>` generic type — `(el: T, key: string) => void | Promise<void>`

### Notes

- Callback execution order is guaranteed: run()-level callback fires before engine-level callback
- All callbacks accept async functions — xeval awaits them internally via void
- On ScriptEngine, the callback fires after the script has already executed — useful for tracking, analytics, or key storage

---

[5.0.1] — 2026-04-26

### Added

**Xeval**
- Source cache on `loadFrom()` — remote files are cached by URL and shared across all calls within the same session
- `ttl` option on `loadFrom()` — cache expiry in milliseconds; omit for permanent cache
- Stale cache fallback — if a fetch fails and an expired cache entry exists, xeval serves it with a warning instead of throwing
- `clearCache(url?)` — invalidate a single URL or the entire cache
- `isCached(url)` — returns true if the URL is cached and not expired
- `cacheInfo(url)` — returns `{ cachedAt, ttl, type }` metadata or null if not cached
- `#buildEngine()` — private helper extracted to avoid duplicating engine construction logic

**Internal**
- Cache storage uses `Map<string, CacheEntry>` where `CacheEntry = { source, type, cachedAt, ttl }`
- Cache is stored on the Xeval singleton — persists across the full page session

---

## [5.0.0] — 2026-04-26

First public release of xeval. Previous iterations (v1–v4) were internal development steps documented below for historical context.
