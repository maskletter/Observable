import * as ts from 'typescript';
import * as chokidar from 'chokidar'
import * as fs from 'fs'
import * as path from 'path'
import tool from './tool';

namespace RppServer{
    const getFileImport = (fileName: string, content: string) => {
        const sourceFile: ts.SourceFile = ts.createSourceFile(fileName, content, 1)
        const set: Set<string> = new Set();
        ts.forEachChild(sourceFile, (node) => visit(node, set));
        return set;
    }
    const visit = (node: ts.Node, set: Set<string>) =>  {
        // console.log(node)

        if(ts.isImportDeclaration(node)){
            // console.log('使用了import')
            // const { name, elements }: any = node.importClause.namedBindings||node.importClause;
            set.add('./src/'+tool.formatImportPath((node.moduleSpecifier as any).text))
            // if(name){
            //     console.log(name.escapedText, node.moduleSpecifier.text)
            // }else{
            //     console.log(elements.map(v => v.name.escapedText), node.moduleSpecifier.text)
            // }
        }else if(ts.isVariableStatement(node)){
            const { expression, arguments: argument }: any = node.declarationList.declarations[0].initializer;
            if(!expression || !expression.escapedText || expression.escapedText != 'require') return
            set.add('./src/'+tool.formatImportPath(argument[0].text))
            // console.log('使用了=', expression.escapedText, argument[0].text)
        }else if(ts.isFunctionDeclaration(node)){
            ts.forEachChild(node.body, (node) => visit(node, set));
        }

    }

    const readFilesRelationship = (path: string, set: Set<string>) => {
        set.add(path)
        getFileImport(path, fs.readFileSync(path).toString()).forEach(v => {
            if(fileType.ts.test(v)) readFilesRelationship(v, set)
            else{
                set.add(v)
            }
        })
    }


    const rootFile: string = './src/app.ts';
  
    const fileType = {
        ts: /^(\s|\S)+(ts|tsx)+$/,
        css: /^(\s|\S)+(css|scss)+$/,
        img: /^(\s|\S)+(gif|jpg|jpeg|png|webp)+$/,
    }
    const watcher = chokidar.watch([]);
    const files: Set<string> = new Set();
    const watchTsConfig = (path: string) => {
        files.add(path)
        watcher.add(path)    
    }

    readFilesRelationship(rootFile, files)
    watcher.add(Array.from(files))
    
    
    watcher.on('add', (path, stats) => {
        
        // if(fileType.ts.test(path)){
        //     getFileImport(path, fs.readFileSync(path).toString()).forEach(v => watchTsConfig(v+'.ts'))
        // }
    })
    watcher.on('change', (path, stats) => {
        console.log(path, stats)
    })
    // watcher.on('ready', () => {
    //     console.log('文件读取完成，即将可以文件解析')
    // })

    // function writeFile(fileName: string, content: string, writeByteOrderMark: boolean){
    //     ts.sys.writeFile(fileName, content, writeByteOrderMark);
    // }

}
