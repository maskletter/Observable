"use strict";
exports.__esModule = true;
var ts = require("typescript");
var chokidar = require("chokidar");
var fs = require("fs");
var tool_1 = require("./tool");
var RppServer;
(function (RppServer) {
    var getFileImport = function (fileName, content) {
        var sourceFile = ts.createSourceFile(fileName, content, 1);
        var set = new Set();
        ts.forEachChild(sourceFile, function (node) { return visit(node, set); });
        return set;
    };
    var visit = function (node, set) {
        // console.log(node)
        if (ts.isImportDeclaration(node)) {
            // console.log('使用了import')
            // const { name, elements }: any = node.importClause.namedBindings||node.importClause;
            set.add('./src/' + tool_1["default"].formatImportPath(node.moduleSpecifier.text));
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
            set.add('./src/' + tool_1["default"].formatImportPath(argument[0].text));
            // console.log('使用了=', expression.escapedText, argument[0].text)
        }
        else if (ts.isFunctionDeclaration(node)) {
            ts.forEachChild(node.body, function (node) { return visit(node, set); });
        }
    };
    var readFilesRelationship = function (path, set) {
        set.add(path);
        getFileImport(path, fs.readFileSync(path).toString()).forEach(function (v) {
            if (fileType.ts.test(v))
                readFilesRelationship(v, set);
            else {
                set.add(v);
            }
        });
    };
    var rootFile = './src/app.ts';
    var fileType = {
        ts: /^(\s|\S)+(ts|tsx)+$/,
        css: /^(\s|\S)+(css|scss)+$/,
        img: /^(\s|\S)+(gif|jpg|jpeg|png|webp)+$/
    };
    var watcher = chokidar.watch([]);
    var files = new Set();
    var watchTsConfig = function (path) {
        files.add(path);
        watcher.add(path);
    };
    readFilesRelationship(rootFile, files);
    watcher.add(Array.from(files));
    watcher.on('add', function (path, stats) {
        // if(fileType.ts.test(path)){
        //     getFileImport(path, fs.readFileSync(path).toString()).forEach(v => watchTsConfig(v+'.ts'))
        // }
    });
    watcher.on('change', function (path, stats) {
        console.log(path, stats);
    });
    // watcher.on('ready', () => {
    //     console.log('文件读取完成，即将可以文件解析')
    // })
    // function writeFile(fileName: string, content: string, writeByteOrderMark: boolean){
    //     ts.sys.writeFile(fileName, content, writeByteOrderMark);
    // }
})(RppServer || (RppServer = {}));
