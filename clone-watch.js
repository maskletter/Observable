var Observable;
(function (Observable) {
    var GlobalArray = window.Array;
    var GlobalObject = window.Object;
    Observable.version = 0.01;
    Observable.libName = 'Observable';
    /**
     * 判断赋的值是否为object对象，如果是object，则需要进行进一步监听object内的对象
     * @param val 传进的值
     * @param parentKey 父级的key
     * @param obs 父级的obs
     */
    var createNewWatch = function (val, parentKey, obs) {
        if (typeof val != 'object')
            return val;
        if (val instanceof GlobalArray) {
            return Array(val, obs.path.concat(parentKey), obs.event);
        }
        else {
            return Object(val, obs.path.concat(parentKey), obs.event);
        }
    };
    /**
     * 给目标对象赋值，并禁止此对象的枚举
     * @param data
     * @param key
     * @param val
     */
    Observable.forbidEnumerable = function (data, key, value) {
        GlobalObject.defineProperty(data, key, { value: value });
    };
    /**
     * 创建一个私有得到数组类
     * @param data
     * @param path
     */
    var Array = function (data, path, event) {
        var __obs = {
            path: path,
            value: [],
            event: event
        };
        function Array() {
            var _this = this;
            data.forEach(function (v) { return _this.push(v); });
        }
        Array.prototype = [];
        Observable.forbidEnumerable(Array.prototype, 'constructor', GlobalArray);
        Observable.forbidEnumerable(Array.prototype, '__obs', __obs);
        Observable.forbidEnumerable(Array.prototype, 'push', function (val) {
            var key = __obs.value.length;
            __obs.value[key] = createNewWatch(val, key, __obs);
            GlobalArray.prototype.push.call(this, void 0);
            defineProperty(this, key);
            return key + 1;
        });
        Observable.forbidEnumerable(Array.prototype, 'reverse', function (val) {
            return __obs.value.reverse() && this;
        });
        Observable.forbidEnumerable(Array.prototype, 'pop', function () {
            GlobalArray.prototype.pop.call(this);
            return __obs.value.pop();
        });
        Observable.forbidEnumerable(Array.prototype, 'unshift', function (val) {
            var key = __obs.value.length;
            __obs.value.unshift(createNewWatch(val, key, __obs));
            GlobalArray.prototype.push.call(this, void 0);
            defineProperty(this, key);
            return key + 1;
        });
        Observable.forbidEnumerable(Array.prototype, 'shift', function () {
            GlobalArray.prototype.pop.call(this);
            return __obs.value.shift() && this;
        });
        Observable.forbidEnumerable(Array.prototype, 'splice', function (start, end, val) {
            var length = __obs.value.length;
            var newValue = __obs.value.slice();
            var result;
            if (val) {
                // val = createNewWatch(val, this.length, __obs);
                newValue.splice(start, end, val);
                result = GlobalArray.prototype.splice.apply(this, [start, end, val]);
            }
            else {
                newValue.splice(start, end);
                result = GlobalArray.prototype.splice.apply(this, [start, end]);
            }
            if (length < this.length) {
                defineProperty(this, this.length);
            }
            __obs.value = newValue;
            return result;
        });
        return new Array();
    };
    /**
     * 创建一个私有object类
     * @param data
     * @param path
     * @param event
     */
    var Object = function (data, path, event) {
        var __obs = {
            path: path,
            value: data,
            event: event
        };
        function Object() {
            for (var key in data) {
                this.set(key, data[key]);
            }
        }
        Observable.forbidEnumerable(Object.prototype, 'set', function (key, value) {
            data[key] = createNewWatch(value, key, __obs);
            defineProperty(this, key);
        });
        Observable.forbidEnumerable(Object.prototype, '__obs', __obs);
        return new Object();
    };
    /**创建程序监听 */
    var defineProperty = function (object, key) {
        var path = object.__obs.path.concat(key);
        try {
            GlobalObject.defineProperty(object, key, {
                enumerable: true,
                configurable: true,
                get: function () {
                    object.__obs.event.get && object.__obs.event.get(path);
                    return object.__obs.value[key];
                },
                set: function (val) {
                    object.__obs.event.set && object.__obs.event.set(path, val);
                    object.__obs.value[key] = val;
                }
            });
        }
        catch (error) {
            // console.log(error, object)
        }
    };
    /**
     * 初始化程序
     * @param data      传入的数据
     * @param event     传入的监听回调
     */
    Observable.create = function (data, event) {
        if (event === void 0) { event = {}; }
        var path = [];
        return Object(data, path, event);
    };
})(Observable || (Observable = {}));
var data1 = {
    name: "tom",
    age: 14,
    friend: {
        "name1": "张三",
        "name2": "李四",
        "name3": "王五",
        "name4": "赵六"
    },
    month: ['一', "二", "三", "四", "五", {
            name: 'tom',
            age: 14,
            school: ['一中', '二中']
        },]
};
var data2 = {
    // count: 0,
    other: {
        // name: 'xx',
        age: 22,
        aa: [1, 2, 3],
        cc: [],
        ff: {
            t: 2
        }
    }
};
var watch2 = Observable.create(data1, {
    set: function (path, val) {
        console.log(path, val);
    }
});
console.log(watch2);
