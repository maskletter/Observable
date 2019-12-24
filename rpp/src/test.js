const ts = require('typescript')


const source = ts.createSourceFile('./test.js',`
    import { of } from "rxjs";
    import * as ff from "rxjs";
    import aaa from "rxjs";
    const b = require("aa");
    function bb(){
        const a = b("aaa");
    }
`, 1)
// console.log(source)
ts.forEachChild(source, visit);

function visit(node) {
    // console.log(node)

    if(ts.isImportDeclaration(node)){
        console.log('使用了import')
        const { name, elements } = node.importClause.namedBindings||node.importClause;
        if(name){
            console.log(name.escapedText, node.moduleSpecifier.text)
        }else{
            console.log(elements.map(v => v.name.escapedText), node.moduleSpecifier.text)
        }
    }else if(ts.isVariableStatement(node)){
        const { expression, arguments } = node.declarationList.declarations[0].initializer;
        if(!expression || !expression.escapedText || expression.escapedText != 'require') return
        console.log('使用了=', expression.escapedText, arguments[0].text)
    }else if(ts.isFunctionDeclaration(node)){
        ts.forEachChild(node.body, visit);
    }

}
