import { CoreEngine } from './CoreEngine'
import { HtmlRunOptions, HtmlUpdateOptions, InsertPosition } from '../types'
import { resolveTarget } from '../utils'
import { XEVAL_TAG } from '../constants'

export class HtmlEngine extends CoreEngine {

    run(options: HtmlRunOptions = {}): Element {
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

        // Détecter si le HTML est un seul élément racine
        const isSingleElement = this._isSingleElementHTML(interpolatedHTML)

        let elementToInject: Element

        if (isSingleElement) {
            // Créer un élément temporaire pour extraire l'élément unique
            const tempContainer = document.createElement('div')
            tempContainer.innerHTML = interpolatedHTML.trim()
            elementToInject = tempContainer.firstElementChild as Element

            // Appliquer les attributs sur l'élément extrait
            if (id) elementToInject.id = id
            if (className) elementToInject.className = className
        } else {
            // Utiliser un wrapper div pour plusieurs éléments ou fragments
            const wrapper = document.createElement('div')
            this._applyContent(wrapper, interpolatedHTML, safe)

            if (id) wrapper.id = id
            if (className) wrapper.className = className

            elementToInject = wrapper
        }

        const key = this._stamp(elementToInject)
        this._insert(elementToInject, container, position)

        void this._fireInject(elementToInject, key, onInject)

        return elementToInject
    }

    /**
     * Détecte si le HTML fourni représente un seul élément racine
     * @param html - Chaîne HTML à analyser
     * @returns true si c'est un seul élément, false sinon
     */
    protected _isSingleElementHTML(html: string): boolean {
        const trimmed = html.trim()

        // Vérifier si ça commence par une balise ouvrante et finit par la balise fermante correspondante
        const openingTagMatch = trimmed.match(/^<([a-zA-Z][a-zA-Z0-9]*)(?:\s[^>]*)?>/)
        if (!openingTagMatch) {
            return false // Pas de balise ouvrante valide
        }

        const tagName = openingTagMatch[1].toLowerCase()

        // Vérifier si ça finit par la balise fermante correspondante
        const closingTag = `</${tagName}>`
        if (!trimmed.endsWith(closingTag)) {
            return false // Ne finit pas par la balise fermante correcte
        }

        // Compter les balises ouvrantes et fermantes pour s'assurer qu'il n'y a qu'un seul élément racine
        const tempContainer = document.createElement('div')
        tempContainer.innerHTML = trimmed

        // Vérifier qu'il y a exactement un élément enfant et pas de texte adjacent
        return tempContainer.children.length === 1 && tempContainer.firstElementChild?.tagName.toLowerCase() === tagName
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

    inject(options: HtmlRunOptions = {}): Element {
        return this.run(options)
    }
}
