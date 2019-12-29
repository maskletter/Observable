import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import tool from './tool';
import TsServer from './tsserver'

namespace RppServer {
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

        // if(ts.isClassDeclaration(node) && node.decorators && node.decorators.length == 1){
            
        // }else 
        if(ts.isImportDeclaration(node)){
            foramtImportPath((node.moduleSpecifier as any).text, set)
        }else if(ts.isVariableStatement(node)){
            const { expression, arguments: argument }: any = node.declarationList.declarations[0].initializer;
            if(!expression || !expression.escapedText || expression.escapedText != 'require') return
            foramtImportPath(argument[0].text, set)
        }else if(ts.isFunctionDeclaration(node)){
            ts.forEachChild(node.body, (node) => visit(node, set));
        }

    }
    const findFiles = (fileName: string = tool.srcCwd, regExp: RegExp, set: Set<string> = new Set()) => {
        fs.readdirSync(fileName).forEach(v => {
            const state = fs.statSync(path.join(fileName,v));
            if(state.isDirectory()){
                findFiles(path.join(fileName,v), regExp,set)
            }else if(regExp.test(v)){
                set.add(path.join(fileName, v))
            }
        })
        return set;
    }
    const parseImportRelation = (path: string) => {
        const content = fs.readFileSync(path);
        return getFileImport(path, content.toString())
    }

    const readFilesRelationship = (path: string, call:(path: string, tsfile: boolean) => void) => {
        // set.add(path)
        call(path, true)
        parseImportRelation(path).forEach(v => {
            if(v.type == 'modules') return GlobalModules.add(v.value)
            const tsfile = fileType.ts.test(v.value);
            if(tsfile) {
                readFilesRelationship(v.value, call)
            }
            call(v.value, tsfile)
        })
    }

    const GlobalModules: Set<string> = new Set();
    const rootFile: string = path.join(tool.srcCwd,'app.ts');
    /**存储所有解析到的ts文件 */
    const files: Set<string> = new Set();
    const fileType = {
        ts: /^(\s|\S)+(ts|tsx)+$/,
        css: /^(\s|\S)+(css|scss)+$/,
        img: /^(\s|\S)+(gif|jpg|jpeg|png|webp)+$/,
    }

    const createProcess = (path: string, _files: Set<string>) => {
        readFilesRelationship(path, (_path, tsfile) => {
            if(tsfile){
                if(files.has(_path)) return
                else _files.add(_path),files.add(_path)
            }
            watchFile(_path, tsfile)
        })
    }


    /**文件监听程序 */
    export const watchFile = (path: string, tsfile: boolean) => {
        fs.watchFile(path, { persistent: true, interval: 250 }, (curr, prev) => {
            if (+curr.mtime <= +prev.mtime) {
              return;
            }
            if(tsfile) {
                const set: Set<string> = new Set();
                createProcess(path, set)
                if(set.size) tsServer.addFile(Array.from(set));
                tsServer.emitFile(path)
            }
            // console.log('文件变化了', path)
        });
    }


    findFiles(undefined, /^(\s|\S)+(d.ts)+$/).forEach(v => {
        files.add(v);
        watchFile(v, true)
    })

    createProcess(rootFile, files)

    const tsServer = new TsServer(Array.from(files), tool.getTsConfig(), writeFile)


    function writeFile(fileName: string, content: string, writeByteOrderMark: boolean){
        console.log('输入',fileName)
        ts.sys.writeFile(fileName, content, writeByteOrderMark);
    }

}