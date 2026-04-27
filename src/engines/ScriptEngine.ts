import { CoreEngine } from './CoreEngine'
import { ScriptRunOptions } from '../types'
import { resolveTarget } from '../utils'

export class ScriptEngine extends CoreEngine {

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

        void this._fireInject(script, key, onInject)

        return script
    }

    inject(options: ScriptRunOptions = {}): HTMLScriptElement {
        return this.run(options)
    }
}
