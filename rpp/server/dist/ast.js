"use strict";
exports.__esModule = true;
var recast = require("recast");
// console.log(recast)
var default_1 = /** @class */ (function () {
    function default_1(fileName, content) {
        this.importLib = new Set();
        this.exportMethods = new Map();
        var $this = this;
        this.parse = recast.parse(content);
        recast.visit(this.parse, {
            visitExpression: function (path) {
                if (!path.value.callee || !path.value.callee.name || path.value.callee.name != 'require')
                    return true;
                $this.importLib.add(path.value.arguments[0].value);
                return true;
            },
            visitExpressionStatement: function (path) {
                if (!path.value.expression || !path.value.expression.left)
                    return true;
                var code = recast.print(path.value.expression.left).code;
                if (code != 'exports.default') {
                    if (/exports\.([a-zA-Z0-9_]+?)$/.test(code)) {
                        $this.exportMethods.set(code.replace('exports.', ''), path.value);
                    }
                    return true;
                }
                $this.defaultExport = path.value;
                return true;
            }
        });
    }
    return default_1;
}());
exports["default"] = default_1;
