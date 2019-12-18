namespace Observable2{

    const GlobalArray = window.Array
    const GlobalObject = window.Object
    
    export const version: number = 0.01;
    export const libName: string = 'Observable'
    interface Obs{
        path: string[]
        value: any,
        event: WatchCallbak
    }
    interface WatchCallbak{
        get?: Function
        set?: Function
    }

    /**
     * 判断赋的值是否为object对象，如果是object，则需要进行进一步监听object内的对象
     * @param val 传进的值
     * @param parentKey 父级的key
     * @param obs 父级的obs
     */
    const createNewWatch = (val: any, parentKey: string, obs: Obs): any => {
        if(typeof val != 'object') return val;
        if(val instanceof GlobalArray){
            return Array(val, obs.path.concat(parentKey), obs.event)
        }else{
            return Object(val, obs.path.concat(parentKey), obs.event)
        }
    }

    /**
     * 给目标对象赋值，并禁止此对象的枚举
     * @param data 
     * @param key 
     * @param val 
     */
    export const forbidEnumerable = (data: object, key: string, value: any): void => {
        GlobalObject.defineProperty(data, key, { value })
    }
    
    /**
     * 创建一个私有得到数组类
     * @param data 
     * @param path 
     */
    const Array = (data: any, path: string[], event: WatchCallbak) => {
        const __obs: Obs = {
            path: path,
            value: [],
            event: event
        }
        function Array(){
            data.forEach(v => this.push(v))
        }
        Array.prototype = [];
        forbidEnumerable(Array.prototype,'constructor', GlobalArray)
        forbidEnumerable(Array.prototype,'__obs', __obs)
        forbidEnumerable(Array.prototype,'push', function(val: any){
            const key =  __obs.value.length
            __obs.value[key] = createNewWatch(val, key, __obs)
            GlobalArray.prototype.push.call(this, void 0)
            defineProperty(this, key)
            return key+1
        })
        forbidEnumerable(Array.prototype,'reverse', function(val: any){
            return __obs.value.reverse() && this;
        })
        forbidEnumerable(Array.prototype, 'pop', function(){
            GlobalArray.prototype.pop.call(this)
            return __obs.value.pop()
        })
        forbidEnumerable(Array.prototype, 'unshift', function(val: any){
            const key = __obs.value.length;
            __obs.value.unshift(createNewWatch(val, key, __obs))
            GlobalArray.prototype.push.call(this, void 0)
            defineProperty(this, key)
            return key+1
        })
        forbidEnumerable(Array.prototype, 'shift', function(){
            GlobalArray.prototype.pop.call(this)
            return __obs.value.shift() && this;
        })
        forbidEnumerable(Array.prototype, 'splice', function(start: any, end: any, val?: any){
            let length = __obs.value.length
            let newValue = [...__obs.value]
            let result;
            if(val){
                // val = createNewWatch(val, this.length, __obs);
                newValue.splice(start, end, val)
                result = GlobalArray.prototype.splice.apply(this,[start, end, val])
            }else{
                newValue.splice(start, end)
                result = GlobalArray.prototype.splice.apply(this,[start, end])
            }
            if(length < this.length){
                defineProperty(this, this.length)
            }   
            __obs.value = newValue
            return result
        })
       
        return new Array();
    }
    
    /**
     * 创建一个私有object类
     * @param data 
     * @param path 
     * @param event 
     */
    const Object = (data: any, path: string[], event: WatchCallbak) => {
        const __obs: Obs = {
            path: path,
            value: data,
            event: event
        }
        function Object(){
            for(var key in data){
                this.set(key, data[key])
            }
        }
        forbidEnumerable(Object.prototype,'set', function(key: string, value: any){
            data[key] = createNewWatch(data[key], key, __obs)
            defineProperty(this, key)
        })
        forbidEnumerable(Object.prototype,'__obs', __obs);
        return new Object();
    }

    /**创建程序监听 */
    const defineProperty = (object: any&{__obs:Obs}, key: string): void => {
        const path = object.__obs.path.concat(key)
        try {
            GlobalObject.defineProperty(object, key, {
                enumerable: true,
                configurable: true,
                get(){
                    object.__obs.event.get && object.__obs.event.get(path)
                    return object.__obs.value[key]
                },
                set(val){
                    object.__obs.event.set && object.__obs.event.set(path,val)
                    object.__obs.value[key] = val
                }
            })
        } catch (error) {
            // console.log(error, object)
        }
    }

    /**
     * 初始化程序
     * @param data      传入的数据
     * @param event     传入的监听回调
     */
    export const create = (data: any, event: WatchCallbak = {}) => {
        const path: string[] = [];
        return Object(data, path, event)
    }

}

const data1 = {
    name: "tom",
    age: 14,
    friend: {
        "name1": "张三",
        "name2": "李四",
        "name3": "王五",
        "name4": "赵六"
    },
    month: ['一',"二","三","四","五"]
}
const data2=  {
    // count: 0,
    other: {
        // name: 'xx',
        age: 22,
        aa: [1,2,3],
        cc: [],
        ff:{
            t:2
        }
    },
    // people: [
    //     "123123",
    //     {
    //         name: 'tom',
    //         age: 14,
    //         school: ['一中','二中']
    //     },
    //     true,
    //     {
    //         name: 'job',
    //         age: 21,
    //         // school: ['北京大学','河北大学']
    //     }
    // ]
}
const watch2 = Observable2.create(data1, {
    set(path,val){
        console.log(path,val)
    }
})
console.log(watch2)