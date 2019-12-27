import * as ts from 'typescript';
import * as chokidar from 'chokidar'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import tool from './tool';
import TsServer, { files as serverFiles } from './tsserver'

namespace RppServer{
    const getFileImport = (fileName: string, content: string) => {
        const sourceFile: ts.SourceFile = ts.createSourceFile(fileName, content, 1)
        const set: Set<{type:'lib'|'modules',value:string}> = new Set();
        ts.forEachChild(sourceFile, (node) => visit(node, set));
        return set;
    }
    const foramtImportPath = (_path: string, set: Set<{type:'lib'|'modules',value:string}>) => {
        const _f = tool.getImportPath(_path);
        if(_f){
            set.add({ type: 'lib', value: _f })
        }else{
            set.add({ type: 'modules', value: _path })
        }
    }
    const visit = (node: ts.Node, set: Set<{type:'lib'|'modules',value:string}>) =>  {
        // console.log(node)

        if(ts.isImportDeclaration(node)){
            // const { name, elements }: any = node.importClause.namedBindings||node.importClause;
            foramtImportPath((node.moduleSpecifier as any).text, set)
            // console.log(tool.getImportPath((node.moduleSpecifier as any).text))
            // set.add('./src/'+tool.getImportPath((node.moduleSpecifier as any).text))
            // if(name){
            //     console.log(name.escapedText, node.moduleSpecifier.text)
            // }else{
            //     console.log(elements.map(v => v.name.escapedText), node.moduleSpecifier.text)
            // }
        }else if(ts.isVariableStatement(node)){
            const { expression, arguments: argument }: any = node.declarationList.declarations[0].initializer;
            if(!expression || !expression.escapedText || expression.escapedText != 'require') return
            foramtImportPath(argument[0].text, set)
            // set.add('./src/'+tool.getImportPath(argument[0].text))
            // console.log('使用了=', expression.escapedText, argument[0].text)
        }else if(ts.isFunctionDeclaration(node)){
            ts.forEachChild(node.body, (node) => visit(node, set));
        }

    }
    /**搜索文件下的.d.ts文件 */
    const findDts = (fileName: string = tool.srcCwd, set: Set<string>) => {
        fs.readdirSync(fileName).forEach(v => {
            const state = fs.statSync(path.join(fileName,v));
            if(state.isDirectory()){
                findDts(path.join(fileName,v),set)
            }else if(/^(\s|\S)+(d.ts)+$/.test(v)){
                set.add(path.join(fileName, v))
            }
        })

    }

    const parseImportRelation = (path: string) => {
        const content = fs.readFileSync(path);
        serverFiles.set(path, content)
        return getFileImport(path, content.toString())
    }

    const readFilesRelationship = (path: string, set: Set<string>) => {
        set.add(path)
        parseImportRelation(path).forEach(v => {
            if(v.type == 'modules') return GlobalModules.add(v.value)
            if(fileType.ts.test(v.value)) {
                readFilesRelationship(v.value, set)
                set.add(v.value)
            }
            
        })
    }

    /**引入的modules包 */
    const GlobalModules: Set<string> = new Set();
    const rootFile: string = path.join(tool.srcCwd,'app.ts');
  
    const fileType = {
        ts: /^(\s|\S)+(ts|tsx)+$/,
        css: /^(\s|\S)+(css|scss)+$/,
        img: /^(\s|\S)+(gif|jpg|jpeg|png|webp)+$/,
    }
    const watchFileContent: Map<string, string> = new Map();
    /**文件变化监听器 */
    const watcher = chokidar.watch([], {
        persistent: true
    });
    /**存储.d.ts文件 */
    const allTypeDts: Set<string> = new Set();
    /**存储所有解析到的ts文件 */
    const files: Set<string> = new Set();
    const watchTsConfig = (path: string) => {
        files.add(path)
        watcher.add(path)    
    }
    findDts(tool.srcCwd,allTypeDts)
   
    readFilesRelationship(rootFile, files)
   
    const tsServer = new TsServer(Array.from(files).concat(Array.from(allTypeDts)), tool.getTsConfig(), writeFile)
    watcher.add(Array.from(files))
   
    watcher.on('change', (path, stats) => {
        console.log(path)
        // const md5 = fs.readFileSync(path).toString();
        // const oldMd5 = watchFileContent.get(path)
        // if(oldMd5 == md5) return
        // watchFileContent.set(path,md5)
        // const set: Set<string> = new Set()
        // console.log(`监听了${path}`)
        // parseImportRelation(path).forEach(v => {
        //     if(files.has(v.value) || GlobalModules.has(v.value)) return
        //     if(v.type == 'modules') return GlobalModules.add(v.value)
        //     if(fileType.ts.test(v.value)) {
        //         readFilesRelationship(v.value, set)
        //         set.add(v.value)
        //     }
        // })
        // if(set.size){
        //     tsServer.addFile(Array.from(set))
        //     watcher.add(Array.from(set))
        // }
        // tsServer.emitFile(path)
    })
 

    function writeFile(fileName: string, content: string, writeByteOrderMark: boolean){
        console.log('输入',fileName)
        ts.sys.writeFile(fileName, content, writeByteOrderMark);
    }

}
