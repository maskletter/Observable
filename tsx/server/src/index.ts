import * as chokidar from 'chokidar'
import tool from './tool';
import WatchServer from './server'
import * as ts from 'typescript'
import AstParse from './parse'
namespace TsServer{

    const fileType = {
        ts: /^(\s|\S)+(ts|tsx)+$/,
        css: /^(\s|\S)+(css|scss)+$/,
        img: /^(\s|\S)+(gif|jpg|jpeg|png|webp)+$/,
    }
    let tsServer!: WatchServer
    const watcher = chokidar.watch('./src');

    const files: Set<string> = new Set();

    watcher.on('add', (path, stats) => {
        if(fileType.ts.test(path)){
            tsServer ? tsServer.addFile(path) : files.add(path)
        }
    })
    watcher.on('change', (path, stats) => {
        if(fileType.ts.test(path)){
            tsServer.emitFile(path)
        }
    })

    watcher.on('ready', () => {
        console.log('文件读取完成，即将可以文件解析')
        tsServer = new WatchServer(Array.from(files), tool.getTsConfig(), writeFile)
    })

    function writeFile(fileName: string, content: string, writeByteOrderMark: boolean){
        new AstParse(fileName, content)
        ts.sys.writeFile(fileName, content, writeByteOrderMark);
      
    }

}