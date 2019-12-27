"use strict";
exports.__esModule = true;
var ts = require("typescript");
var chokidar = require("chokidar");
var fs = require("fs");
var path = require("path");
var tool_1 = require("./tool");
var tsserver_1 = require("./tsserver");
var RppServer;
(function (RppServer) {
    var getFileImport = function (fileName, content) {
        var sourceFile = ts.createSourceFile(fileName, content, 1);
        var set = new Set();
        ts.forEachChild(sourceFile, function (node) { return visit(node, set); });
        return set;
    };
    var foramtImportPath = function (_path, set) {
        var _f = tool_1["default"].getImportPath(_path);
        if (_f) {
            set.add({ type: 'lib', value: _f });
        }
        else {
            set.add({ type: 'modules', value: _path });
        }
    };
    var visit = function (node, set) {
        // console.log(node)
        if (ts.isImportDeclaration(node)) {
            // const { name, elements }: any = node.importClause.namedBindings||node.importClause;
            foramtImportPath(node.moduleSpecifier.text, set);
            // console.log(tool.getImportPath((node.moduleSpecifier as any).text))
            // set.add('./src/'+tool.getImportPath((node.moduleSpecifier as any).text))
            // if(name){
            //     console.log(name.escapedText, node.moduleSpecifier.text)
            // }else{
            //     console.log(elements.map(v => v.name.escapedText), node.moduleSpecifier.text)
            // }
        }
        else if (ts.isVariableStatement(node)) {
            var _a = node.declarationList.declarations[0].initializer, expression = _a.expression, argument = _a.arguments;
            if (!expression || !expression.escapedText || expression.escapedText != 'require')
                return;
            foramtImportPath(argument[0].text, set);
            // set.add('./src/'+tool.getImportPath(argument[0].text))
            // console.log('使用了=', expression.escapedText, argument[0].text)
        }
        else if (ts.isFunctionDeclaration(node)) {
            ts.forEachChild(node.body, function (node) { return visit(node, set); });
        }
    };
    /**搜索文件下的.d.ts文件 */
    var findDts = function (fileName, set) {
        if (fileName === void 0) { fileName = tool_1["default"].srcCwd; }
        fs.readdirSync(fileName).forEach(function (v) {
            var state = fs.statSync(path.join(fileName, v));
            if (state.isDirectory()) {
                findDts(path.join(fileName, v), set);
            }
            else if (/^(\s|\S)+(d.ts)+$/.test(v)) {
                set.add(path.join(fileName, v));
            }
        });
    };
    var parseImportRelation = function (path) {
        var content = fs.readFileSync(path);
        tsserver_1.files.set(path, content);
        return getFileImport(path, content.toString());
    };
    var readFilesRelationship = function (path, set) {
        set.add(path);
        parseImportRelation(path).forEach(function (v) {
            if (v.type == 'modules')
                return GlobalModules.add(v.value);
            if (fileType.ts.test(v.value)) {
                readFilesRelationship(v.value, set);
                set.add(v.value);
            }
        });
    };
    /**引入的modules包 */
    var GlobalModules = new Set();
    var rootFile = path.join(tool_1["default"].srcCwd, 'app.ts');
    var fileType = {
        ts: /^(\s|\S)+(ts|tsx)+$/,
        css: /^(\s|\S)+(css|scss)+$/,
        img: /^(\s|\S)+(gif|jpg|jpeg|png|webp)+$/
    };
    var watchFileContent = new Map();
    /**文件变化监听器 */
    var watcher = chokidar.watch([], {
        persistent: true
    });
    /**存储.d.ts文件 */
    var allTypeDts = new Set();
    /**存储所有解析到的ts文件 */
    var files = new Set();
    var watchTsConfig = function (path) {
        files.add(path);
        watcher.add(path);
    };
    findDts(tool_1["default"].srcCwd, allTypeDts);
    readFilesRelationship(rootFile, files);
    var tsServer = new tsserver_1["default"](Array.from(files).concat(Array.from(allTypeDts)), tool_1["default"].getTsConfig(), writeFile);
    watcher.add(Array.from(files));
    watcher.on('change', function (path, stats) {
        console.log(path);
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
    });
    function writeFile(fileName, content, writeByteOrderMark) {
        console.log('输入', fileName);
        ts.sys.writeFile(fileName, content, writeByteOrderMark);
    }
})(RppServer || (RppServer = {}));
