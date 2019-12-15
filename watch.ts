
namespace Observable{
    
    export const version: number = 0.01;
    export const libName: string = 'Observable'

    interface WatchCallbak{
        get?: Function
        set?: Function
    }

    export const formatPath = (path: any[]): string => {
        let str = ''
        path.forEach(v => {
          if (isNaN(v)){
            str += '.'+v
          }else{
            str += '['+v+']'
          }
        })
        return str.substr(1,str.length)
      }

    export const cloneData = (data: any, obs: any) => {
        const dataType = data instanceof Array
        return dataType ? createArray.apply(null, data.concat(obs)) : { ...data }
    }

    export const createObject = function(...argv: any[]){
        
        const [data,{ path, event } ]= argv
        const value = {};
        var Object = function() {
            for(var i in data){
                if(!data.hasOwnProperty(i)) continue
                this.set(i, data[i])
            }
        };
        Object.prototype.set = function(key, val){
            if(typeof val == 'object'){
                val= createData(val, path, key, event)
            }
            value[key] = val
            defineProperty(this, key, this.__obs.value, event, path.concat(key))
        }
        Object.prototype.delete = function(key){
            delete this[key]
            delete value[key]
        }
        Object.prototype.__obs = {
        	path: path,
        	value: value
        }
        return new Object()
    }
    export const createArray = function(...argv: any[]){
        const { path, event } = argv.pop()
        let value: any[] = []
        var Array = function() {
            argv.forEach((v, index) => {
                this.push(v)
            })
        };
        var GlobalArray = (window as any).Array.prototype;
        Array.prototype = [];
        Array.prototype.constructor = Array;
        
        Array.prototype.push = function(val: any){
            if(!val) return value
            if(typeof val == 'object'){
                val = createData(val, path, this.length, event)
            }
            const index = value.push(val);
            GlobalArray.push.call(this, val);
            defineProperty(this, index-1, this.__obs.value, event, path.concat(index-1))
            return index
        }
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
        Array.prototype.unshift = function(val: any){
            if(!val) return value
            if(typeof val == 'object'){
                val = createData(val, path, this.length, event)
            }
            const index = value.unshift(val);
            GlobalArray.unshift.call(this, val);
            defineProperty(this, index-1, this.__obs.value, event, path.concat(index-1))
            return index;
        }
        Array.prototype.pop = function(){
            GlobalArray.pop.call(this)
            return value.pop()
        }
        Array.prototype.shift = function(){
            GlobalArray.shift.call(this)
            return value.shift()
        }
        Array.prototype.reverse = function(){
            return value.reverse()
        }
        Array.prototype.__obs = {
            path: path,
            value: value
        }
        
        return new Array()
    }

    function createData(data: any, path: string[], i: string, event: WatchCallbak){
        const type: boolean = data instanceof Array;
        if(type){
            return createArray.apply(null, data.concat({path: [...path,i], event}),);
        }else{
            return createObject(data, {path: [...path,i], event})
        }
    }

    function objectRecursive(aims: object,data: any, event: WatchCallbak, path: string[]){
    	if(typeof data != 'object') {
            throw "请传入object对象";
        }
        for(let i in data){
            if(data.hasOwnProperty && !data.hasOwnProperty(i)) continue;
            if(typeof data[i] == 'object'){
                data[i] = createData(data[i], path, i, event)
            }
            defineProperty(aims, i, data.__obs||data, event, [...path, i])
        }
    }

    function defineProperty(aims, key, data, event: WatchCallbak, path: string[] ){
    	Object.defineProperty(aims, key, {
            enumerable: false,
            configurable: true,
    		get(){
                event.get && event.get(path)
                // console.log(data,key)
    			return data[key]
    		},
    		set(val){
                event.set && event.set(path, val)
    			data[key] = val
    		}
    	})
    }

    export const create = function(this:any,data: any, event: WatchCallbak = {}, path: string[] = []){
        const aims = this.libName == Observable.libName && this.version == Observable.version? {...data} : this;
    	objectRecursive(aims, data, event, path)
        return aims
    }


}

const data=  {
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
    people: [
        "123123",
        {
            name: 'tom',
            age: 14,
            school: ['一中','二中']
        },
        true,
        {
            name: 'job',
            age: 21,
            // school: ['北京大学','河北大学']
        }
    ]
}
const watch = Observable.create(data, {
    set(path: string[], val: string){
        console.log('触发了赋值操作', Observable.formatPath(path))
    }
})
// const watch = Observable.create.call({ name: 'tom' }, data, {
//     get(path: string[]){
        
//     },
//     set(path: string[], val: string){
//         console.log(val, path)
//     }
// })
console.log(watch)