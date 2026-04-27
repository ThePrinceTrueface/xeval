import { CoreEngine } from './CoreEngine'
import { CssRunOptions, CssUpdateOptions } from '../types'
import { resolveTarget } from '../utils'
import { XEVAL_TAG } from '../constants'

export class CSSEngine extends CoreEngine {

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

    inject(options: CssRunOptions = {}): HTMLStyleElement {
        return this.run(options)
    }
}
