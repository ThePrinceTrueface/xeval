# ── v1.0.0 ──────────────────────────────────
git add .
git commit -m "feat: initial implementation of Xeval and ScriptEngine"
git tag v1.0.0

# ── v2.0.0 ──────────────────────────────────
git commit -m "fix: resolve fetch() naming conflict with globalThis.fetch"
git commit -m "fix: correct templateEngine double replace missing argument"
git commit -m "refactor: rename fetch() to loadFrom() to avoid global conflict"
git commit -m "refactor: rename variables for clarity (code→source, injectedScripts→scriptRegistry, etc)"
git commit -m "feat: add render() method for preview without DOM injection"
git commit -m "feat: add cleanup() to remove injected scripts from DOM"
git commit -m "feat: add module option on run() for type=module support"
git tag v2.0.0

# ── v3.0.0 ──────────────────────────────────
git commit -m "refactor: extract CoreEngine as shared base class for all engines"
git commit -m "feat: add HtmlEngine with innerHTML and textContent support"
git commit -m "feat: add prepareHTML() entry point on Xeval"
git commit -m "feat: add position option (append, prepend, before, after, replace) on HtmlEngine"
git commit -m "feat: add safe mode option on HtmlEngine using textContent"
git commit -m "feat: add auto-detection of file type from URL extension in loadFrom()"
git commit -m "feat: loadFrom() now returns HtmlEngine for .html files"
git tag v3.0.0

# ── v4.0.0 ──────────────────────────────────
git commit -m "feat: add CSSEngine with <style> injection support"
git commit -m "feat: add prepareCSS() entry point on Xeval"
git commit -m "feat: add media option on CSSEngine.run()"
git commit -m "feat: add update() on HtmlEngine to modify injected content without re-injection"
git commit -m "feat: add update() on CSSEngine to modify injected <style> without re-injection"
git commit -m "feat: loadFrom() now returns CSSEngine for .css files"
git commit -m "refactor: resolveTarget() accepts fallback param — head for CSS, body for others"
git tag v4.0.0

# ── v5.0.0 ──────────────────────────────────
git commit -m "feat: stamp every injected element with a unique data-xeval-key via crypto.randomUUID()"
git commit -m "feat: add getByKey() public method on CoreEngine to retrieve element by key"
git commit -m "feat: add cleanupOne(key) to remove a single injection by its key"
git commit -m "feat: add lastKey, lastInjected and keys getters on CoreEngine"
git commit -m "refactor: replace elementRegistry array with Map<key, Element> for O(1) key lookup"
git commit -m "refactor: update() on HtmlEngine and CSSEngine now resolves target by key → id → lastInjected"
git tag v5.0.0