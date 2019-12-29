"use strict";
exports.__esModule = true;
var ts = require("typescript");
var path = require("path");
var fs = require("fs");
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
        // if(ts.isClassDeclaration(node) && node.decorators && node.decorators.length == 1){
        // }else 
        if (ts.isImportDeclaration(node)) {
            foramtImportPath(node.moduleSpecifier.text, set);
        }
        else if (ts.isVariableStatement(node)) {
            var _a = node.declarationList.declarations[0].initializer, expression = _a.expression, argument = _a.arguments;
            if (!expression || !expression.escapedText || expression.escapedText != 'require')
                return;
            foramtImportPath(argument[0].text, set);
        }
        else if (ts.isFunctionDeclaration(node)) {
            ts.forEachChild(node.body, function (node) { return visit(node, set); });
        }
    };
    var findFiles = function (fileName, regExp, set) {
        if (fileName === void 0) { fileName = tool_1["default"].srcCwd; }
        if (set === void 0) { set = new Set(); }
        fs.readdirSync(fileName).forEach(function (v) {
            var state = fs.statSync(path.join(fileName, v));
            if (state.isDirectory()) {
                findFiles(path.join(fileName, v), regExp, set);
            }
            else if (regExp.test(v)) {
                set.add(path.join(fileName, v));
            }
        });
        return set;
    };
    var parseImportRelation = function (path) {
        var content = fs.readFileSync(path);
        return getFileImport(path, content.toString());
    };
    var readFilesRelationship = function (path, call) {
        // set.add(path)
        call(path, true);
        parseImportRelation(path).forEach(function (v) {
            if (v.type == 'modules')
                return GlobalModules.add(v.value);
            var tsfile = fileType.ts.test(v.value);
            if (tsfile) {
                readFilesRelationship(v.value, call);
            }
            call(v.value, tsfile);
        });
    };
    var GlobalModules = new Set();
    var rootFile = path.join(tool_1["default"].srcCwd, 'app.ts');
    /**存储所有解析到的ts文件 */
    var files = new Set();
    var fileType = {
        ts: /^(\s|\S)+(ts|tsx)+$/,
        css: /^(\s|\S)+(css|scss)+$/,
        img: /^(\s|\S)+(gif|jpg|jpeg|png|webp)+$/
    };
    var createProcess = function (path, _files) {
        readFilesRelationship(path, function (_path, tsfile) {
            if (tsfile) {
                if (files.has(_path))
                    return;
                else
                    _files.add(_path), files.add(_path);
            }
            RppServer.watchFile(_path, tsfile);
        });
    };
    /**文件监听程序 */
    RppServer.watchFile = function (path, tsfile) {
        fs.watchFile(path, { persistent: true, interval: 250 }, function (curr, prev) {
            if (+curr.mtime <= +prev.mtime) {
                return;
            }
            if (tsfile) {
                var set = new Set();
                createProcess(path, set);
                if (set.size)
                    tsServer.addFile(Array.from(set));
                tsServer.emitFile(path);
            }
            // console.log('文件变化了', path)
        });
    };
    findFiles(undefined, /^(\s|\S)+(d.ts)+$/).forEach(function (v) {
        files.add(v);
        RppServer.watchFile(v, true);
    });
    createProcess(rootFile, files);
    var tsServer = new tsserver_1["default"](Array.from(files), tool_1["default"].getTsConfig(), writeFile);
    function writeFile(fileName, content, writeByteOrderMark) {
        console.log('输入', fileName);
        ts.sys.writeFile(fileName, content, writeByteOrderMark);
    }
})(RppServer || (RppServer = {}));
