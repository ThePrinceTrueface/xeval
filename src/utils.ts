import { XEVAL_TAG } from './constants'
import { XevalFileType } from './types'

export function generateKey(): string {
    return crypto.randomUUID()
}

export function serializeFunction(fn: (...args: unknown[]) => unknown): string {
    const fnStr = fn.toString().trim()

    if (/^(?:async\s+)?function\s*\*/.test(fnStr)) {
        console.warn(`${XEVAL_TAG} serializeFunction() — generator functions are not supported and will be injected as-is`)
        return fnStr
    }

    const isArrow = /^(?:async\s+)?(?:\(|[\w$]+\s*=>)/.test(fnStr)
        && !fnStr.startsWith('function')
        && !fnStr.startsWith('async function')
    if (isArrow) return fnStr

    const namedMatch = fnStr.match(/^(async\s+)?function\s*[\w$]*\s*(\([^)]*\))\s*(\{[\s\S]*\})$/)
    if (namedMatch) {
        const asyncKw = namedMatch[1] ? 'async ' : ''
        return `${asyncKw}${namedMatch[2]} => ${namedMatch[3]}`
    }

    const shorthandMatch = fnStr.match(/^(async\s+)?[\w$]+\s*(\([^)]*\))\s*(\{[\s\S]*\})$/)
    if (shorthandMatch) {
        const asyncKw = shorthandMatch[1] ? 'async ' : ''
        const params  = shorthandMatch[2]
        const body    = shorthandMatch[3]
        return `${asyncKw}${params} => ${body}`
    }

    console.warn(`${XEVAL_TAG} serializeFunction() — unrecognized function form, injecting as-is`)
    return fnStr
}

export function detectTypeFromUrl(url: string): XevalFileType | null {
    const clean = url.split('?')[0].split('#')[0]
    if (clean.endsWith('.html') || clean.endsWith('.htm')) return 'html'
    if (clean.endsWith('.js')   || clean.endsWith('.mjs')) return 'js'
    if (clean.endsWith('.css'))                            return 'css'
    return null
}

export function resolveTarget(target: string | Element | null | undefined, fallback: Element): Element {
    if (!target) return fallback

    if (target instanceof Element) return target

    const el = document.querySelector(target)
    if (!el) {
        console.warn(`${XEVAL_TAG} target "${target}" not found in DOM — falling back to ${fallback.tagName.toLowerCase()}`)
        return fallback
    }

    return el
}
