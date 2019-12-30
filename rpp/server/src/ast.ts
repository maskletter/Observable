
import * as recast from 'recast'

// console.log(recast)

export default class {

    constructor(fileName: string, content: string){
        const $this = this;
        this.parse = recast.parse(content)
        recast.visit(this.parse, {
            visitExpression(path){
                if(!path.value.callee || !path.value.callee.name || path.value.callee.name != 'require') return true
                $this.importLib.add(path.value.arguments[0].value)
                return true
            },
            visitExpressionStatement(path){
                if(!path.value.expression || !path.value.expression.left) return true
                const code = recast.print(path.value.expression.left).code;
                if(code != 'exports.default') {
                    if(/exports\.([a-zA-Z0-9_]+?)$/.test(code)){
                        $this.exportMethods.set(code.replace('exports.',''), path.value)
                    }
                    return true
                }
                $this.defaultExport = path.value
                return true
            }
        })
    }

    private parse: any
    private importLib: Set<string> = new Set();
    private defaultExport: any
    private exportMethods: Map<string, any> = new Map()

}