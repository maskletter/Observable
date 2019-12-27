"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
var ts = require("typescript");
var tool_1 = require("./tool");
var readFile = ts.sys.readFile;
ts.sys.readFile = function (path, encoding) {
    console.log(path);
    return '';
};
exports.files = new Map();
var TsLanguageService = /** @class */ (function () {
    function TsLanguageService(rootFileNames, options) {
        var _this = this;
        this.rootFileNames = new Set();
        this.files = {};
        this.fileExists = ts.sys.fileExists;
        // readFile = ts.sys.readFile
        this.readDirectory = ts.sys.readDirectory;
        this.compilationSettings = options;
        rootFileNames.forEach(function (v) {
            _this.addFile(v);
        });
    }
    TsLanguageService.prototype.addFile = function (fileName) {
        this.rootFileNames.add(fileName);
        this.files[fileName] = { version: 0 };
    };
    TsLanguageService.prototype.removeFile = function (fileName) {
        this.rootFileNames["delete"](fileName);
        delete this.files[fileName];
    };
    TsLanguageService.prototype.getCompilationSettings = function () {
        return this.compilationSettings;
    };
    ;
    TsLanguageService.prototype.getScriptVersion = function (fileName) {
        return this.files[fileName] && this.files[fileName].version.toString();
    };
    TsLanguageService.prototype.getCurrentDirectory = function () {
        return tool_1["default"].cwd;
    };
    TsLanguageService.prototype.getDefaultLibFileName = function (options) {
        return path.join(tool_1["default"].cwd, 'node_modules/typescript/lib/lib.d.ts');
    };
    TsLanguageService.prototype.getScriptFileNames = function () {
        return Array.from(this.rootFileNames);
    };
    TsLanguageService.prototype.getScriptSnapshot = function (fileName) {
        if (!fs.existsSync(fileName)) {
            return undefined;
        }
        return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
    };
    return TsLanguageService;
}());
var TsServer = /** @class */ (function () {
    function TsServer(rootFileNames, options, writeFile) {
        var _this = this;
        this.srcModulePath = path.normalize(path.join(tool_1["default"].cwd, 'src'));
        this.isCarryOut = false;
        writeFile && (this.writeFile = writeFile);
        this.host = new TsLanguageService(rootFileNames, options);
        this.services = ts.createLanguageService(this.host, ts.createDocumentRegistry());
        this.host.getScriptFileNames().forEach(function (v) {
            _this.emitFile(v);
            fs.watchFile(v, { persistent: true, interval: 250 }, function (curr, prev) {
                if (+curr.mtime <= +prev.mtime) {
                    return;
                }
                console.log('文件变化了', v);
                _this.emitFile(v);
            });
        });
        this.isCarryOut = true;
        this.error();
    }
    TsServer.prototype.addFile = function (file) {
        var _this = this;
        file = file instanceof Array ? file : [file];
        file.forEach(function (v) { return _this.host.addFile(v); });
        file.forEach(function (v) { return _this.emitFile(v); });
    };
    TsServer.prototype.removeFile = function (file) {
        var _this = this;
        file = file instanceof Array ? file : [file];
        file.forEach(function (v) { return _this.host.removeFile(v); });
    };
    TsServer.prototype.isPresence = function (fileName) {
        return this.host.rootFileNames.has(fileName);
    };
    TsServer.prototype.emitFile = function (fileName) {
        var _this = this;
        this.host.files[fileName].version++;
        var output = this.services.getEmitOutput(fileName);
        if (this.isCarryOut)
            this.error();
        output.outputFiles.forEach(function (o) {
            if (_this.writeFile)
                _this.writeFile(o.name, o.text);
            else
                ts.sys.writeFile(o.name, o.text);
        });
    };
    TsServer.prototype.error = function () {
        ts.getPreEmitDiagnostics(this.services.getProgram()).forEach(function (diagnostic) {
            // console.log(diagnostic.file);
            if (diagnostic.file) {
                // if(path.normalize(diagnostic.file.fileName).indexOf(this.srcModulePath) == -1) return
                var _a = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start), line = _a.line, character = _a.character;
                var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
                console.log(diagnostic.file.fileName + " (" + (line + 1) + "," + (character + 1) + "): " + message);
            }
            else {
                console.log("" + ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
            }
        });
    };
    TsServer.prototype.logErrors = function (fileName) {
        var allDiagnostics = this.services
            .getCompilerOptionsDiagnostics()
            .concat(this.services.getSyntacticDiagnostics(fileName))
            .concat(this.services.getSemanticDiagnostics(fileName));
        allDiagnostics.forEach(function (diagnostic) {
            var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            if (diagnostic.file) {
                var _a = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start), line = _a.line, character = _a.character;
                console.log("  Error " + diagnostic.file.fileName + " (" + (line + 1) + "," + (character +
                    1) + "): " + message);
            }
            else {
                console.log("  Error: " + message);
            }
        });
    };
    return TsServer;
}());
exports["default"] = TsServer;
