export type ContextValue =
    | string
    | number
    | boolean
    | object
    | ((...args: unknown[]) => unknown)

export type Context = Record<string, ContextValue>

export type XevalFileType = 'js' | 'html' | 'css'

export type InsertPosition = 'append' | 'prepend' | 'before' | 'after' | 'replace'

export type InjectCallback<T extends Element> = (el: T, key: string) => void | Promise<void>

export interface ScriptRunOptions {
    context?: Context
    module?: boolean
    id?: string
    target?: string | Element
    onInject?: InjectCallback<HTMLScriptElement>
}

export interface HtmlRunOptions {
    context?: Context
    target?: string | Element
    position?: InsertPosition
    safe?: boolean
    id?: string
    class?: string
    onInject?: InjectCallback<Element>
}

export interface HtmlUpdateOptions {
    context?: Context
    safe?: boolean
    key?: string
    id?: string
}

export interface CssRunOptions {
    context?: Context
    target?: string | Element
    id?: string
    media?: string
    onInject?: InjectCallback<HTMLStyleElement>
}

export interface CssUpdateOptions {
    context?: Context
    key?: string
    id?: string
}

export interface LoadFromOptions {
    type?: XevalFileType
    ttl?: number
}

export interface CacheEntry {
    source: string
    type: XevalFileType
    cachedAt: number
    ttl: number | null
}

export interface RenderOptions {
    context?: Context
}
