import { CoreEngine } from './CoreEngine'
import { HtmlRunOptions, HtmlUpdateOptions, InsertPosition } from '../types'
import { resolveTarget } from '../utils'
import { XEVAL_TAG } from '../constants'

export class HtmlEngine extends CoreEngine {

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

    inject(options: HtmlRunOptions = {}): HTMLDivElement {
        return this.run(options)
    }
}
