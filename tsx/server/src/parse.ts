
import * as acorn from 'acorn'
const jsx = require('acorn-jsx')
//为acorn拓展jsx解析
const JsxParse: typeof acorn.Parser = acorn.Parser.extend(jsx())
export default class Parse{

    constructor(path: string, content: string){
        this.ast = JsxParse.parse(content);
    }

    /**代码ast存储 */
    private ast: any;

    public getContent(){
        // return
    }

}