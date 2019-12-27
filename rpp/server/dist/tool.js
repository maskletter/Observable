"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
var ts = require("typescript");
/**
 * 工具类
 */
var tool = /** @class */ (function () {
    function tool() {
    }
    /**
     * 格式化标签View -> view
     * @param name
     */
    tool.FormatLabel = function (name) {
        return name.replace(/['"]/g, '').replace(/[A-Z]/g, function (a, b, c, d) { return (b == 0 ? '' : '-') + a.toLocaleLowerCase(); });
    };
    /**
     * 创建随机数
     * @param length
     */
    tool.createRandom = function (length) {
        if (length === void 0) { length = 10; }
        var str = "", arr = [
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
            'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
        ];
        for (var i = 0; i < length; i++) {
            var pos = Math.round(Math.random() * (arr.length - 1));
            str += arr[pos];
        }
        return str;
    };
    /**
     * 格式化import包的路径
     * @param _path
     */
    tool.getImportPath = function (_path) {
        var url = path.join(tool.srcCwd, _path);
        if (fs.existsSync(url)) {
            if (fs.statSync(url).isDirectory()) {
                return path.join(tool.srcCwd, _path, 'index.ts');
            }
            return _path;
        }
        else if (fs.existsSync(url + '.ts')) {
            return path.join(tool.srcCwd, _path + '.ts');
        }
        else if (fs.existsSync(url + '.tsx')) {
            return path.join(tool.srcCwd, _path + '.tsx');
        }
        else
            return undefined;
    };
    /**
     * 获取tsconfig配置
     */
    tool.getTsConfig = function () {
        var url = path.join(this.cwd, 'tsconfig.json');
        if (!fs.existsSync(url)) {
            this["throw"](new Error('tsconfig.json配置文件不存在'));
        }
        var content = fs.readFileSync(url, { encoding: 'utf-8' });
        var module2 = {
            none: 'None',
            commonjS: 'CommonJS',
            amd: 'AMD',
            umd: 'UMD',
            system: 'System',
            es2015: 'ES2015',
            esnext: 'ESNext'
        };
        var jsxModule = {
            'react': ts.JsxEmit.React,
            'react-native': ts.JsxEmit.ReactNative,
            'preserve': ts.JsxEmit.Preserve
        };
        try {
            var config = JSON.parse(content).compilerOptions;
            if (config.target)
                config.target = ts.ScriptTarget[config.target.toLocaleUpperCase()];
            if (config.lib) {
                // config.lib = config.lib.map(v => path.join(tool.cwd,'node_modules/typescript/lib','lib.'+v+'.d.ts'))
                config.lib = config.lib.map(function (v) { return 'lib.' + v + '.d.ts'; });
            }
            if (config.jsx) {
                config.jsx = jsxModule[config.jsx];
            }
            if (config.module) {
                var moduleName = config.module;
                config.module = ts.ModuleKind[module2[moduleName]];
            }
            if (config.moduleResolution) {
                config.moduleResolution = config.moduleResolution == 'node' ? ts.ModuleResolutionKind.NodeJs : ts.ModuleResolutionKind.Classic;
            }
            // if(config.typeRoots){
            //     config.typeRoots = config.typeRoots.map(v => path.join(tool.cwd,v));
            // }
            return config;
        }
        catch (error) {
            this["throw"](error);
        }
    };
    /**
     * 读取目录内的文件/文件夹
     * @param url
     */
    tool.getDirectory = function (url) {
        if (!fs.existsSync(url))
            return {};
        var data = fs.readdirSync(url);
        var result = {};
        data.forEach(function (v) {
            var stats = fs.statSync(path.join(url, v));
            if (stats.isDirectory())
                result[v] = { type: 'floder', value: v };
            else {
                var key = v.replace(/^(.+?)(.ts)$/, '$1');
                result[key] = { type: 'file', value: v };
            }
        });
        return result;
    };
    /**
     * 创建目录
     * @param dirname
     */
    tool.mkdirSync = function (dirname) {
        if (fs.existsSync(dirname)) {
            return true;
        }
        else {
            if (tool.mkdirSync(path.dirname(dirname))) {
                fs.mkdirSync(dirname);
                return true;
            }
        }
    };
    /**
     * 错误处理
     */
    tool["throw"] = function (error) {
        console.log(error);
    };
    //系统运行当前路径
    tool.cwd = process.cwd();
    tool.tsconfig = tool.getTsConfig();
    tool.buildCwd = path.join(tool.cwd, tool.tsconfig.outDir);
    tool.srcCwd = path.join(tool.cwd, tool.tsconfig.rootDir);
    tool.fileType = {
        ts: /^(\s|\S)+(ts|tsx)+$/,
        css: /^(\s|\S)+(css|scss)+$/,
        img: /^(\s|\S)+(gif|jpg|jpeg|png|webp)+$/
    };
    return tool;
}());
exports["default"] = tool;
