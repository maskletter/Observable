var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var Observable;
(function (Observable) {
    Observable.version = 0.01;
    Observable.libName = 'Observable';
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
    Observable.cloneData = function (data, obs) {
        var dataType = data instanceof Array;
        return dataType ? Observable.createArray.apply(null, data.concat(obs)) : __assign({}, data);
    };
    Observable.createObject = function () {
        var argv = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            argv[_i] = arguments[_i];
        }
        var GlobalObject = window.Object;
        var data = argv[0], _a = argv[1], path = _a.path, event = _a.event;
        var value = {};
        var Object = function () {
            for (var i in data) {
                if (!data.hasOwnProperty(i))
                    continue;
                this.set(i, data[i]);
            }
        };
        GlobalObject.defineProperty(Object.prototype, 'set', {
            value: function (key, val) {
                if (typeof val == 'object') {
                    val = createData(val, path, key, event);
                }
                value[key] = val;
                defineProperty(this, key, this.__obs.value, event, path.concat(key));
            }
        });
        GlobalObject.defineProperty(Object.prototype, 'delete', {
            value: function (key) {
                delete this[key];
                delete value[key];
            }
        });
        GlobalObject.defineProperty(Object.prototype, '__obs', {
            value: {
                path: path,
                value: value
            }
        });
        return new Object();
    };
    Observable.createArray = function () {
        var argv = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            argv[_i] = arguments[_i];
        }
        var _a = argv.pop(), path = _a.path, event = _a.event;
        var value = [];
        var Array = function () {
            var _this = this;
            argv.forEach(function (v, index) {
                _this.push(v);
            });
        };
        var GlobalArray = window.Array.prototype;
        Array.prototype = [];
        Array.prototype.constructor = Array;
        Array.prototype.push = function (val) {
            if (!val)
                return value;
            if (typeof val == 'object') {
                val = createData(val, path, this.length, event);
            }
            var index = value.push(val);
            GlobalArray.push.call(this, val);
            defineProperty(this, index - 1, this.__obs.value, event, path.concat(index - 1));
            return index;
        };
        // Array.prototype.splice = function(start: number, end: number, val: any){
        //     const length = this.length;
        //     if(length == 0){
        //         this.push(val)
        //         return [val]
        //     }
        //     //从新建立一份数据副本,在this调用splice时候会把value也修改掉，但是修改的值有问题，无法直接使用，导致需要创建一个副本，副本在进行splice操作
        //     //原因位置
        //     const __v = [...value]
        //     if(typeof val == 'object'){
        //         val = createData(val, path, this.length, event)
        //     }
        //     // GlobalArray.splice.apply(this, [start, end, val]);
        //     // const result  =__v.splice(start, end, val)
        //     // value = __v
        //     // if(this.length > length && val != void 0) defineProperty(this, this.length, this.__obs.value, event, path.concat(this.length))
        //     // return result
        // }
        Array.prototype.unshift = function (val) {
            if (!val)
                return value;
            if (typeof val == 'object') {
                val = createData(val, path, this.length, event);
            }
            var index = value.unshift(val);
            GlobalArray.unshift.call(this, val);
            defineProperty(this, index - 1, this.__obs.value, event, path.concat(index - 1));
            return index;
        };
        Array.prototype.pop = function () {
            GlobalArray.pop.call(this);
            return value.pop();
        };
        Array.prototype.shift = function () {
            GlobalArray.shift.call(this);
            return value.shift();
        };
        Array.prototype.reverse = function () {
            return value.reverse();
        };
        Array.prototype.__obs = {
            path: path,
            value: value
        };
        return new Array();
    };
    function createData(data, path, i, event) {
        var type = data instanceof Array;
        if (type) {
            return Observable.createArray.apply(null, data.concat({ path: path.concat([i]), event: event }));
        }
        else {
            return Observable.createObject(data, { path: path.concat([i]), event: event });
        }
    }
    function objectRecursive(aims, data, event, path) {
        if (typeof data != 'object') {
            throw "请传入object对象";
        }
        for (var i_1 in data) {
            if (data.hasOwnProperty && !data.hasOwnProperty(i_1))
                continue;
            if (typeof data[i_1] == 'object') {
                data[i_1] = createData(data[i_1], path, i_1, event);
            }
            defineProperty(aims, i_1, data.__obs || data, event, path.concat([i_1]));
        }
    }
    function defineProperty(aims, key, data, event, path) {
        Object.defineProperty(aims, key, {
            //是否可以被枚举
            // enumerable: false,
            // configurable: true,
            get: function () {
                event.get && event.get(path);
                return data[key];
            },
            set: function (val) {
                event.set && event.set(path, val);
                data[key] = val;
            }
        });
    }
    Observable.create = function (data, event, path) {
        if (event === void 0) { event = {}; }
        if (path === void 0) { path = []; }
        var aims = this.libName == Observable.libName && this.version == Observable.version ? __assign({}, data) : this;
        Object.defineProperty(aims, 'set', {
            enumerable: false,
            value: function (key, val) {
                console.log(222);
                if (typeof val == 'object') {
                    val = createData(val, [], key, event);
                }
                aims[key] = val;
                defineProperty(this, key, this.__obs.value, event, path.concat(key));
            }
        });
        objectRecursive(aims, data, event, path);
        return aims;
    };
})(Observable || (Observable = {}));
var data = {
    // count: 0,
    other: {
        // name: 'xx',
        age: 22,
        aa: [1, 2, 3],
        cc: [],
        ff: {
            t: 2
        }
    },
    people: [
        "123123",
        {
            name: 'tom',
            age: 14,
            school: ['一中', '二中']
        },
        true,
        {
            name: 'job',
            age: 21
        }
    ]
};
var watch = Observable.create(data, {
    set: function (path, val) {
        console.log('触发了赋值操作', Observable.formatPath(path));
    }
});
// const watch = Observable.create.call({ name: 'tom' }, data, {
//     get(path: string[]){
//     },
//     set(path: string[], val: string){
//         console.log(val, path)
//     }
// })
for (var i in watch) {
    console.log(i);
}
console.log(watch);
