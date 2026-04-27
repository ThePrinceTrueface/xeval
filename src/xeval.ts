import { ScriptEngine } from './engines/ScriptEngine'
import { HtmlEngine } from './engines/HtmlEngine'
import { CSSEngine } from './engines/CSSEngine'
import { LoadFromOptions, XevalFileType, CacheEntry } from './types'
import { detectTypeFromUrl } from './utils'
import { XEVAL_TAG } from './constants'

class Xeval {

    #cache: Map<string, CacheEntry> = new Map()

    prepare(source: string): ScriptEngine {
        return new ScriptEngine(source)
    }

    prepareHTML(source: string): HtmlEngine {
        return new HtmlEngine(source)
    }

    prepareCSS(source: string): CSSEngine {
        return new CSSEngine(source)
    }

    async loadFrom(url: string, options: LoadFromOptions = {}): Promise<ScriptEngine | HtmlEngine | CSSEngine> {
        const { ttl = null } = options
        const resolvedType: XevalFileType | null = options.type ?? detectTypeFromUrl(url)

        if (!resolvedType) {
            throw new Error(
                `${XEVAL_TAG} cannot detect file type from "${url}". ` +
                `Pass { type: 'js' }, { type: 'html' }, or { type: 'css' } explicitly.`
            )
        }

        const cached = this.#cache.get(url)

        if (cached) {
            const isExpired = cached.ttl !== null && (Date.now() - cached.cachedAt) > cached.ttl
            if (!isExpired) {
                console.debug(`${XEVAL_TAG} cache hit for "${url}"`)
                return this.#buildEngine(cached.source, cached.type)
            }
            this.#cache.delete(url)
            console.debug(`${XEVAL_TAG} cache expired for "${url}" — refetching`)
        }

        try {
            const response = await globalThis.fetch(url)

            if (!response.ok) {
                throw new Error(
                    `${XEVAL_TAG} failed to load "${url}": ${response.status} ${response.statusText}`
                )
            }

            const source = await response.text()

            this.#cache.set(url, {
                source,
                type: resolvedType,
                cachedAt: Date.now(),
                ttl
            })

            return this.#buildEngine(source, resolvedType)

        } catch (err) {
            const stale = this.#cache.get(url)
            if (stale) {
                console.warn(`${XEVAL_TAG} fetch failed for "${url}" — serving stale cache as fallback`)
                return this.#buildEngine(stale.source, stale.type)
            }

            console.error(`${XEVAL_TAG} loadFrom error:`, err)
            throw err
        }
    }

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

    isCached(url: string): boolean {
        const entry = this.#cache.get(url)
        if (!entry) return false
        if (entry.ttl !== null && (Date.now() - entry.cachedAt) > entry.ttl) return false
        return true
    }

    cacheInfo(url: string): { cachedAt: number; ttl: number | null; type: XevalFileType } | null {
        const entry = this.#cache.get(url)
        if (!entry) return null
        return {
            cachedAt: entry.cachedAt,
            ttl:      entry.ttl,
            type:     entry.type
        }
    }

    #buildEngine(source: string, type: XevalFileType): ScriptEngine | HtmlEngine | CSSEngine {
        if (type === 'html') return new HtmlEngine(source)
        if (type === 'css')  return new CSSEngine(source)
        return new ScriptEngine(source)
    }
}

export { Xeval }
