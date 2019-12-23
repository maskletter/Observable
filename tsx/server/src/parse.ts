
import * as acorn from 'acorn'
const jsx = require('acorn-jsx')
const recast = require('recast')
//为acorn拓展jsx解析
const JsxParse: typeof acorn.Parser = acorn.Parser.extend(jsx())
export default class Parse{

    constructor(path: string, content: string){
        this.ast = JsxParse.parse(content);
        recast.visit(this.ast, {
            visitExpressionStatement: function({node}) {
                if(node.expression && node.expression.left && node.expression.left.object.name == 'exports' && node.expression.left.property.name == 'default'){
                    console.log('默认导出')
                }
                return false
              }
        })
    }

    /**代码ast存储 */
    private ast: any;

    public getContent(){
        // return
    }

}