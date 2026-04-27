import { XEVAL_TAG, XEVAL_KEY_ATTR } from '../constants'
import { Context, InjectCallback, RenderOptions } from '../types'
import { generateKey } from '../utils'
import { TemplateEngine } from './TemplateEngine'

export abstract class CoreEngine {

    #source: string
    #keyRegistry: Map<string, Element> = new Map()
    #engineInjectCallback: InjectCallback<Element> | null = null
    #templateEngine: TemplateEngine = new TemplateEngine()

    constructor(source: string) {
        if (typeof source !== 'string') {
            throw new TypeError(`${XEVAL_TAG} CoreEngine expects a string, got: ${typeof source}`)
        }
        this.#source = source
    }

    protected _interpolate(template: string, context?: Context): string {
        return this.#templateEngine.interpolate(template, context)
    }

    protected _stamp(el: Element): string {
        const key = generateKey()
        el.setAttribute(XEVAL_KEY_ATTR, key)
        this.#keyRegistry.set(key, el)
        return key
    }

    protected _getByKey(key: string): Element | null {
        return this.#keyRegistry.get(key) ?? null
    }

    getByKey(key: string): Element | null {
        return this._getByKey(key)
    }

    get lastKey(): string | null {
        const keys = [...this.#keyRegistry.keys()]
        return keys.at(-1) ?? null
    }

    get lastInjected(): Element | null {
        return this.lastKey ? this._getByKey(this.lastKey) : null
    }

    get keys(): string[] {
        return [...this.#keyRegistry.keys()]
    }

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

    cleanup(): void {
        for (const el of this.#keyRegistry.values()) {
            el.remove()
        }
        this.#keyRegistry.clear()
    }

    onInject(callback: InjectCallback<Element>): this {
        this.#engineInjectCallback = callback
        return this
    }

    protected async _fireInject<T extends Element>(
        el: T,
        key: string,
        runCallback?: InjectCallback<T>
    ): Promise<void> {
        if (runCallback) await runCallback(el, key)
        if (this.#engineInjectCallback) await this.#engineInjectCallback(el, key)
    }

    render(options: RenderOptions = {}): string {
        return this._interpolate(this.#source, options.context)
    }

    get rawSource(): string {
        return this.#source
    }

    protected get _source(): string {
        return this.#source
    }

    /**
     * Expose le moteur de template pour un accès direct si nécessaire
     * (utile pour les tests ou utilisations avancées)
     */
    get templateEngine(): TemplateEngine {
        return this.#templateEngine
    }
}
