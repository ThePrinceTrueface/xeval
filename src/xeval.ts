/**
 * xeval — Dynamic script, HTML & CSS injection library with template engine
 * @version 5.0.0
 */

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

const XEVAL_TAG      = '[xeval]'
const XEVAL_KEY_ATTR = 'data-xeval-key'


// ─────────────────────────────────────────────
//  Public types
// ─────────────────────────────────────────────

/** Values accepted as context for $$placeholder interpolation */
export type ContextValue =
    | string
    | number
    | boolean
    | object
    | ((...args: unknown[]) => unknown)

/** Context map passed to run(), update() or render() */
export type Context = Record<string, ContextValue>

/** Supported file types for loadFrom() */
export type XevalFileType = 'js' | 'html' | 'css'

/** DOM insertion positions for HtmlEngine */
export type InsertPosition = 'append' | 'prepend' | 'before' | 'after' | 'replace'

/** Callback fired after an element is injected into the DOM */
export type InjectCallback<T extends Element> = (el: T, key: string) => void | Promise<void>

/** Options for ScriptEngine.run() */
export interface ScriptRunOptions {
    context?: Context
    module?: boolean
    id?: string
    target?: string | Element
    /** Callback fired after this specific injection. Called before the engine-level callback. */
    onInject?: InjectCallback<HTMLScriptElement>
}

/** Options for HtmlEngine.run() */
export interface HtmlRunOptions {
    context?: Context
    target?: string | Element
    position?: InsertPosition
    safe?: boolean
    id?: string
    class?: string
    /** Callback fired after this specific injection. Called before the engine-level callback. */
    onInject?: InjectCallback<HTMLDivElement>
}

/** Options for HtmlEngine.update() */
export interface HtmlUpdateOptions {
    context?: Context
    safe?: boolean
    key?: string
    id?: string
}

/** Options for CSSEngine.run() */
export interface CssRunOptions {
    context?: Context
    target?: string | Element
    id?: string
    media?: string
    /** Callback fired after this specific injection. Called before the engine-level callback. */
    onInject?: InjectCallback<HTMLStyleElement>
}

/** Options for CSSEngine.update() */
export interface CssUpdateOptions {
    context?: Context
    key?: string
    id?: string
}

/** Options for Xeval.loadFrom() */
export interface LoadFromOptions {
    type?: XevalFileType
    /** Cache TTL in milliseconds. If omitted, cache never expires. */
    ttl?: number
}

/** Internal cache entry */
interface CacheEntry {
    source: string
    type: XevalFileType
    cachedAt: number
    ttl: number | null
}

/** Options for CoreEngine.render() */
export interface RenderOptions {
    context?: Context
}


// ─────────────────────────────────────────────
//  Utilities
// ─────────────────────────────────────────────

function generateKey(): string {
    return crypto.randomUUID()
}

function detectTypeFromUrl(url: string): XevalFileType | null {
    const clean = url.split('?')[0].split('#')[0]
    if (clean.endsWith('.html') || clean.endsWith('.htm')) return 'html'
    if (clean.endsWith('.js')   || clean.endsWith('.mjs')) return 'js'
    if (clean.endsWith('.css'))                            return 'css'
    return null
}

function resolveTarget(target: string | Element | null | undefined, fallback: Element): Element {
    if (!target) return fallback

    if (target instanceof Element) return target

    const el = document.querySelector(target)
    if (!el) {
        console.warn(`${XEVAL_TAG} target "${target}" not found in DOM — falling back to ${fallback.tagName.toLowerCase()}`)
        return fallback
    }

    return el
}


// ─────────────────────────────────────────────
//  CoreEngine — shared base for all engines
// ─────────────────────────────────────────────

export abstract class CoreEngine {

    #source: string
    #keyRegistry: Map<string, Element> = new Map()
    #engineInjectCallback: InjectCallback<Element> | null = null

    constructor(source: string) {
        if (typeof source !== 'string') {
            throw new TypeError(`${XEVAL_TAG} CoreEngine expects a string, got: ${typeof source}`)
        }
        this.#source = source
    }

    // ── Interpolation ──────────────────────────

    protected _interpolate(template: string, context?: Context): string {
        if (!context || typeof context !== 'object') return template

        const placeholderRegexp = /\$\$(\w+)/g

        return template.replaceAll(placeholderRegexp, (match: string, key: string): string => {
            if (!(key in context)) return match

            const value = context[key]

            if (typeof value === 'function') {
                const fnStr = value.toString()
                const isArrow = fnStr.includes('=>')
                const serializedFn = isArrow
                    ? fnStr
                    : fnStr.replace(/^function\s*\w*\s*/, '').replace(/^/, '() => ')
                return `const ${key} = ${serializedFn}`
            }

            if (typeof value === 'object') {
                return JSON.stringify(value)
            }

            return String(value)
        })
    }

    // ── Key & Registry ─────────────────────────

    protected _stamp(el: Element): string {
        const key = generateKey()
        el.setAttribute(XEVAL_KEY_ATTR, key)
        this.#keyRegistry.set(key, el)
        return key
    }

    protected _getByKey(key: string): Element | null {
        return this.#keyRegistry.get(key) ?? null
    }

    /**
     * Retrieve an injected element by its unique xeval key
     */
    getByKey(key: string): Element | null {
        return this._getByKey(key)
    }

    /**
     * The key of the last element injected by this engine instance
     */
    get lastKey(): string | null {
        const keys = [...this.#keyRegistry.keys()]
        return keys.at(-1) ?? null
    }

    /**
     * The last element injected by this engine instance
     */
    get lastInjected(): Element | null {
        return this.lastKey ? this._getByKey(this.lastKey) : null
    }

    /**
     * All injection keys generated by this engine instance, in order
     */
    get keys(): string[] {
        return [...this.#keyRegistry.keys()]
    }

    // ── Cleanup ────────────────────────────────

    /**
     * Remove a single injected element from the DOM by its xeval key
     * @returns true if found and removed, false otherwise
     */
    cleanupOne(key: string): boolean {
        const el = this._getByKey(key)
        if (!el) {
            console.warn(`${XEVAL_TAG} cleanupOne() — no element found for key "${key}"`)
            return false
        }
        el.remove()
        this.#keyRegistry.delete(key)
        return true
    }

    /**
     * Remove all elements injected by this engine instance from the DOM
     */
    cleanup(): void {
        for (const el of this.#keyRegistry.values()) {
            el.remove()
        }
        this.#keyRegistry.clear()
    }

    // ── Callbacks ──────────────────────────────

    /**
     * Register a callback fired after every injection made by this engine instance.
     * Called after the run()-level callback if both are defined.
     * Returns the engine instance for chaining.
     */
    onInject(callback: InjectCallback<Element>): this {
        this.#engineInjectCallback = callback
        return this
    }

    /**
     * Fire both the run-level and engine-level onInject callbacks
     * Order: run() callback first → engine callback second
     */
    protected async _fireInject<T extends Element>(
        el: T,
        key: string,
        runCallback?: InjectCallback<T>
    ): Promise<void> {
        if (runCallback) await runCallback(el, key)
        if (this.#engineInjectCallback) await this.#engineInjectCallback(el, key)
    }

    // ── Source access ──────────────────────────

    /**
     * Return the interpolated source without injecting anything into the DOM
     */
    render(options: RenderOptions = {}): string {
        return this._interpolate(this.#source, options.context)
    }

    /**
     * The raw original source before any interpolation
     */
    get rawSource(): string {
        return this.#source
    }

    protected get _source(): string {
        return this.#source
    }
}


// ─────────────────────────────────────────────
//  ScriptEngine — JS injection
// ─────────────────────────────────────────────

export class ScriptEngine extends CoreEngine {

    /**
     * Interpolate and inject the script into the DOM
     * @returns the injected HTMLScriptElement (carries data-xeval-key)
     */
    run(options: ScriptRunOptions = {}): HTMLScriptElement {
        const { context, module: asModule = false, id, target, onInject } = options

        const interpolatedCode = this._interpolate(this._source, context)
        const container = resolveTarget(target, document.body)

        const script = document.createElement('script')
        if (asModule) script.type = 'module'
        if (id) script.id = id
        script.textContent = interpolatedCode

        const key = this._stamp(script)
        container.appendChild(script)

        // fire callbacks asynchronously — script has already executed at this point
        void this._fireInject(script, key, onInject)

        return script
    }

    /** Alias for run() */
    inject(options: ScriptRunOptions = {}): HTMLScriptElement {
        return this.run(options)
    }

    // NOTE: update() is intentionally not implemented on ScriptEngine.
    // Modifying a <script> element's textContent after execution has no effect
    // in any browser — the code is already parsed and run.
    // To re-run with new context, use: engine.cleanup() then engine.run()
}


// ─────────────────────────────────────────────
//  HtmlEngine — HTML injection
// ─────────────────────────────────────────────

export class HtmlEngine extends CoreEngine {

    /**
     * Interpolate and inject HTML into the DOM
     * @returns the injected wrapper HTMLDivElement (carries data-xeval-key)
     */
    run(options: HtmlRunOptions = {}): HTMLDivElement {
        const {
            context,
            target,
            position = 'append',
            safe = false,
            id,
            class: className,
            onInject
        } = options

        const interpolatedHTML = this._interpolate(this._source, context)
        const container = resolveTarget(target, document.body)

        const wrapper = document.createElement('div')
        this._applyContent(wrapper, interpolatedHTML, safe)

        if (id) wrapper.id = id
        if (className) wrapper.className = className

        const key = this._stamp(wrapper)
        this._insert(wrapper, container, position)

        void this._fireInject(wrapper, key, onInject)

        return wrapper
    }

    /**
     * Update the content of an already injected element without re-injecting
     * Resolves target in this order: key → id → lastInjected
     * @returns the updated element, or null if not found
     */
    update(options: HtmlUpdateOptions = {}): Element | null {
        const { context, safe = false, key, id } = options

        const target = key
            ? this._getByKey(key)
            : id
                ? document.getElementById(id)
                : this.lastInjected

        if (!target) {
            console.warn(`${XEVAL_TAG} HtmlEngine.update() — no injected element found to update`)
            return null
        }

        const interpolatedHTML = this._interpolate(this._source, context)
        this._applyContent(target, interpolatedHTML, safe)

        return target
    }

    protected _applyContent(el: Element, content: string, safe: boolean): void {
        if (safe) {
            el.textContent = content
        } else {
            el.innerHTML = content
        }
    }

    protected _insert(el: Element, container: Element, position: InsertPosition): void {
        switch (position) {
            case 'append':
                container.appendChild(el)
                break
            case 'prepend':
                container.insertBefore(el, container.firstChild)
                break
            case 'before':
                container.parentNode?.insertBefore(el, container)
                break
            case 'after':
                container.parentNode?.insertBefore(el, container.nextSibling)
                break
            case 'replace':
                container.innerHTML = ''
                container.appendChild(el)
                break
            default:
                console.warn(`${XEVAL_TAG} unknown position "${position as string}" — falling back to append`)
                container.appendChild(el)
        }
    }

    /** Alias for run() */
    inject(options: HtmlRunOptions = {}): HTMLDivElement {
        return this.run(options)
    }
}


// ─────────────────────────────────────────────
//  CSSEngine — CSS injection
// ─────────────────────────────────────────────

export class CSSEngine extends CoreEngine {

    /**
     * Interpolate and inject CSS into the DOM as a <style> element
     * @returns the injected HTMLStyleElement (carries data-xeval-key)
     */
    run(options: CssRunOptions = {}): HTMLStyleElement {
        const { context, target, id, media, onInject } = options

        const interpolatedCSS = this._interpolate(this._source, context)
        const container = resolveTarget(target, document.head)

        const styleEl = document.createElement('style')
        styleEl.textContent = interpolatedCSS
        if (id) styleEl.id = id
        if (media) styleEl.media = media

        const key = this._stamp(styleEl)
        container.appendChild(styleEl)

        void this._fireInject(styleEl, key, onInject)

        return styleEl
    }

    /**
     * Update the content of an already injected <style> element
     * Resolves target in this order: key → id → lastInjected
     * @returns the updated element, or null if not found
     */
    update(options: CssUpdateOptions = {}): HTMLStyleElement | null {
        const { context, key, id } = options

        const target = key
            ? this._getByKey(key)
            : id
                ? document.getElementById(id)
                : this.lastInjected

        if (!target) {
            console.warn(`${XEVAL_TAG} CSSEngine.update() — no injected <style> found to update`)
            return null
        }

        target.textContent = this._interpolate(this._source, context)

        return target as HTMLStyleElement
    }

    /** Alias for run() */
    inject(options: CssRunOptions = {}): HTMLStyleElement {
        return this.run(options)
    }
}


// ─────────────────────────────────────────────
//  Xeval — main entry point (singleton)
// ─────────────────────────────────────────────

class Xeval {

    // ── Source cache ───────────────────────────
    // Map<url, CacheEntry> — shared across all loadFrom() calls
    #cache: Map<string, CacheEntry> = new Map()

    /** Prepare a JS script from a raw source string */
    prepare(source: string): ScriptEngine {
        return new ScriptEngine(source)
    }

    /** Prepare an HTML template from a raw source string */
    prepareHTML(source: string): HtmlEngine {
        return new HtmlEngine(source)
    }

    /** Prepare a CSS stylesheet from a raw source string */
    prepareCSS(source: string): CSSEngine {
        return new CSSEngine(source)
    }

    /**
     * Load a JS, HTML, or CSS file from a remote URL.
     * Type is auto-detected from the file extension (.js, .mjs, .html, .htm, .css).
     * Pass { type } explicitly when the URL has no recognizable extension.
     * Pass { ttl } in milliseconds to set a cache expiry. Omit for permanent cache.
     * If a fetch fails and a cached version exists, the cache is served as fallback.
     */
    async loadFrom(url: string, options: LoadFromOptions = {}): Promise<ScriptEngine | HtmlEngine | CSSEngine> {
        const { ttl = null } = options
        const resolvedType: XevalFileType | null = options.type ?? detectTypeFromUrl(url)

        if (!resolvedType) {
            throw new Error(
                `${XEVAL_TAG} cannot detect file type from "${url}". ` +
                `Pass { type: 'js' }, { type: 'html' }, or { type: 'css' } explicitly.`
            )
        }

        // ── Check cache ────────────────────────
        const cached = this.#cache.get(url)

        if (cached) {
            const isExpired = cached.ttl !== null && (Date.now() - cached.cachedAt) > cached.ttl
            if (!isExpired) {
                console.debug(`${XEVAL_TAG} cache hit for "${url}"`)
                return this.#buildEngine(cached.source, cached.type)
            }
            // expired — remove and refetch
            this.#cache.delete(url)
            console.debug(`${XEVAL_TAG} cache expired for "${url}" — refetching`)
        }

        // ── Fetch ──────────────────────────────
        try {
            const response = await globalThis.fetch(url)

            if (!response.ok) {
                throw new Error(
                    `${XEVAL_TAG} failed to load "${url}": ${response.status} ${response.statusText}`
                )
            }

            const source = await response.text()

            // store in cache
            this.#cache.set(url, {
                source,
                type: resolvedType,
                cachedAt: Date.now(),
                ttl
            })

            return this.#buildEngine(source, resolvedType)

        } catch (err) {
            // ── Network fallback ───────────────
            // If fetch fails but we have a stale (expired) cache entry, serve it
            const stale = this.#cache.get(url)
            if (stale) {
                console.warn(`${XEVAL_TAG} fetch failed for "${url}" — serving stale cache as fallback`)
                return this.#buildEngine(stale.source, stale.type)
            }

            console.error(`${XEVAL_TAG} loadFrom error:`, err)
            throw err
        }
    }

    /**
     * Clear the source cache
     * - Pass a URL to remove a single entry
     * - Call with no argument to clear the entire cache
     */
    clearCache(url?: string): void {
        if (url) {
            const deleted = this.#cache.delete(url)
            if (!deleted) {
                console.warn(`${XEVAL_TAG} clearCache() — no cache entry found for "${url}"`)
            }
        } else {
            this.#cache.clear()
        }
    }

    /**
     * Check whether a URL is currently cached and not expired
     */
    isCached(url: string): boolean {
        const entry = this.#cache.get(url)
        if (!entry) return false
        if (entry.ttl !== null && (Date.now() - entry.cachedAt) > entry.ttl) return false
        return true
    }

    /**
     * Return cache metadata for a given URL, or null if not cached
     */
    cacheInfo(url: string): { cachedAt: number; ttl: number | null; type: XevalFileType } | null {
        const entry = this.#cache.get(url)
        if (!entry) return null
        return {
            cachedAt: entry.cachedAt,
            ttl:      entry.ttl,
            type:     entry.type
        }
    }

    // ── Private helpers ────────────────────────

    #buildEngine(source: string, type: XevalFileType): ScriptEngine | HtmlEngine | CSSEngine {
        if (type === 'html') return new HtmlEngine(source)
        if (type === 'css')  return new CSSEngine(source)
        return new ScriptEngine(source)
    }
}

export default new Xeval()