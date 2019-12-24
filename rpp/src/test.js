const ts = require('typescript')


const source = ts.createSourceFile('./test.js',`
    import { of } from "rxjs";
    import * as ff from "rxjs";
    import aaa from "rxjs";
    const b = require("aa");
    function bb(){
        const a = b;
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
            console.log(name.escapedText)
        }else{
            console.log(elements.map(v => v.name.escapedText))
        }
    }else if(ts.isVariableStatement(node)){
        console.log('使用了=')
    }else if(ts.isFunctionDeclaration(node)){
        ts.forEachChild(node.body, visit);
    }

}
