import { XEVAL_TAG } from '../constants'
import { Context } from '../types'
import { serializeFunction } from '../utils'

/**
 * Moteur de template responsible de l'interpolation et de la sérialisation
 * des valeurs de contexte dans les chaînes de caractères.
 *
 * Syntaxe : $$nomVariable
 *
 * Exemples:
 *   - $$counter => remplacé par la valeur de context.counter
 *   - $$myFunc => remplacé par la fonction sérialisée context.myFunc
 *   - $$config => remplacé par JSON.stringify(context.config)
 */
export class TemplateEngine {

    private static readonly PLACEHOLDER_REGEXP = /\$\$(\w+)/g

    /**
     * Interpole un template avec les valeurs du contexte fourni.
     * Supporte : strings, numbers, booleans, objects (JSON), et fonctions (sérialisées)
     *
     * @param template - Chaîne contenant les placeholders $$key
     * @param context - Objet contenant les valeurs à interpoler
     * @returns Template interpolé
     */
    interpolate(template: string, context?: Context): string {
        if (!context || typeof context !== 'object') {
            return template
        }

        return template.replaceAll(
            TemplateEngine.PLACEHOLDER_REGEXP,
            (match: string, key: string): string => this._resolveValue(match, key, context)
        )
    }

    /**
     * Résout une valeur de contexte en sa représentation de chaîne.
     * @param match - Le match complet (ex: "$$myVar")
     * @param key - La clé extraite du match
     * @param context - Le contexte d'interpolation
     * @returns La valeur interpolée ou le match original si la clé n'existe pas
     */
    private _resolveValue(match: string, key: string, context: Context): string {
        if (!(key in context)) {
            return match
        }

        const value = context[key]

        // Sérialiser les fonctions en fonctions fléchées
        if (typeof value === 'function') {
            return `const ${key} = ${serializeFunction(value as (...args: unknown[]) => unknown)}`
        }

        // Sérialiser les objets en JSON
        if (typeof value === 'object') {
            return JSON.stringify(value)
        }

        // Convertir primitives (string, number, boolean) en chaîne
        return String(value)
    }

    /**
     * Valide un contexte avant interpolation (optionnel, pour les cas stricts)
     * @param context - Contexte à valider
     * @throws Error si le contexte ne peut pas être interprété
     */
    validateContext(context: unknown): context is Context {
        if (context === null) {
            console.warn(`${XEVAL_TAG} TemplateEngine.validateContext() — context is null`)
            return false
        }

        if (typeof context !== 'object') {
            console.warn(`${XEVAL_TAG} TemplateEngine.validateContext() — context must be an object, got: ${typeof context}`)
            return false
        }

        return true
    }

    /**
     * Extrait tous les placeholders d'une chaîne de template
     * @param template - Chaîne à analyser
     * @returns Array de clés trouvées (ex: ['counter', 'myFunc', 'config'])
     */
    extractPlaceholders(template: string): string[] {
        const placeholders: string[] = []
        let match: RegExpExecArray | null

        const regexp = new RegExp(TemplateEngine.PLACEHOLDER_REGEXP)
        while ((match = regexp.exec(template)) !== null) {
            placeholders.push(match[1])
        }

        return placeholders
    }

    /**
     * Vérifie si un template contient des placeholders non résolus
     * @param interpolated - Chaîne après interpolation
     * @returns true si des placeholders restent non résolu (ex: $$undefined)
     */
    hasUnresolvedPlaceholders(interpolated: string): boolean {
        return TemplateEngine.PLACEHOLDER_REGEXP.test(interpolated)
    }

    /**
     * Obtient les placeholders non résolus d'une chaîne
     * @param interpolated - Chaîne après interpolation
     * @returns Array de placeholders non résolus
     */
    getUnresolvedPlaceholders(interpolated: string): string[] {
        const unresolvedPlaceholders: string[] = []
        let match: RegExpExecArray | null

        const regexp = new RegExp(TemplateEngine.PLACEHOLDER_REGEXP)
        while ((match = regexp.exec(interpolated)) !== null) {
            unresolvedPlaceholders.push(match[0])
        }

        return unresolvedPlaceholders
    }
}

