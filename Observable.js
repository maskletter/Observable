var Observable;
(function (Observable) {
    var GlobalArray = window.Array;
    var GlobalObject = window.Object;
    Observable.version = 0.01;
    Observable.libName = 'Observable';
    Observable.remark = '一个数据监听小工具';
    Observable.formatPath = function (path) {
        var str = '';
        path.forEach(function (v) {
            if (isNaN(v)) {
                str += '.' + v;
            }
            else {
                str += '[' + v + ']';
            }
        });
        return str.substr(1, str.length);
    };
    var defineProperty = function (object, key, value, path, event) {
        GlobalObject.defineProperty(object, key, {
            enumerable: true,
            get: function () {
                event.get && event.get(path);
                return value;
            },
            set: function (val) {
                if (typeof val == 'object') {
                    val = createNewWatch(val, path, key, event);
                }
                event.set && event.set(path, val);
                value = val;
            }
        });
    };
    var hiddenMethod = function (data, key) {
        GlobalObject.defineProperty(data, key, { enumerable: false });
    };
    var createNewWatch = function (val, path, parentKey, event) {
        if (typeof val != 'object')
            return val;
        if (val instanceof GlobalArray) {
            return Array(val, path.concat(parentKey), event);
        }
        return Object(val, path.concat(parentKey), event);
    };
    var Array = function (data, path, event) {
        function Array() {
            var _this = this;
            data.forEach(function (v) { return _this.push(v); });
        }
        Array.prototype = [];
        Array.prototype.constructor = Array;
        Array.prototype.push = function (val) {
            var key = this.length;
            val = createNewWatch(val, path, key, event);
            GlobalArray.prototype.push.call(this, val);
            defineProperty(this, key, val, path.concat(key), event);
            return key + 1;
        };
        Array.prototype.unshift = function (val) {
            var key = this.length;
            val = createNewWatch(val, path, key, event);
            GlobalArray.prototype.unshift.call(this, val);
            defineProperty(this, key, this[key], path.concat(key), event);
            return key + 1;
        };
        hiddenMethod(Array.prototype, 'constructor');
        hiddenMethod(Array.prototype, 'push');
        hiddenMethod(Array.prototype, 'unshift');
        return new Array();
    };
    var Object = function (data, path, event) {
        function Object() {
            for (var key in data) {
                this.set(key, data[key]);
            }
        }
        Object.prototype.set = function (key, val) {
            data[key] = createNewWatch(val, path, key, event);
            defineProperty(this, key, data[key], path.concat(key), event);
        };
        hiddenMethod(Object.prototype, 'set');
        return new Object();
    };
    Observable.create = function (data, event) {
        if (event === void 0) { event = {}; }
        return Object(data, [], event);
    };
})(Observable || (Observable = {}));
