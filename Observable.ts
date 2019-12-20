/**
 * @author maskletter
 * @time 2019-12-20
 * @cmd tsc Observable.ts -w --removeComments
 */
namespace Observable{

    const GlobalArray = (window as any).Array
    const GlobalObject = (window as any).Object
    
    export const version: number = 0.01;
    export const libName: string = 'Observable'
    export const remark: string = '一个数据监听小工具'
    interface WatchCallbak{
        get?: Function
        set?: Function
    }

    /**
     * 这个工具就是为了将path数组转为字符串用的
     * @param path 
     */
    export const formatPath = (path: Array<string|number>): string => {
        let str = ''
        path.forEach(v => {
          if (isNaN(<number>v)){
            str += '.'+v
          }else{
            str += '['+v+']'
          }
        })
        return str.substr(1,str.length)
    }

    /**
     * 
     * @param object  监听的对象
     * @param key 监听对象的key
     * @param value 监听对象的值
     * @param path 父级的key，数组合集
     * @param event 一个监听回调( event:{ get(){},set(){} } )
     */
    const defineProperty = (object, key, value, path, event) => {
        GlobalObject.defineProperty(object, key, {
            //设置对象可以被枚举
            enumerable: true,
            get(){
                event.get && event.get(path)
                return value
            },
            set(val){
                if(typeof val == 'object'){
                    val = createNewWatch(val, path, key, event)
                }
                event.set && event.set(path, val)
                value = val
            }
        })
    }

    /**
     * 创建一个工具，用来隐藏不允许被枚举的变量
     * @param data 
     * @param key 
     */
    const hiddenMethod = (data: object, key: string): void => {
        GlobalObject.defineProperty(data, key,{ enumerable: false });
    }

    /**
     * 创建一个数据格式化工具
     * @param val           值
     * @param path          父级路径
     * @param parentKey     父级key
     * @param event         监听器
     */
    const createNewWatch = (val, path, parentKey, event) => {
       //如果值不是object类型，那么直接返回此值
       if(typeof val != 'object') return val;
       //反之如果是object类型，那么调用Object，在进行子元素的遍历及监听
       //Object会在下面的代码中进行创建
       if(val instanceof GlobalArray){
           //是个是数组的话就走刚才创建的数组对象
           return Array(val,path.concat(parentKey), event)
       }
       return Object(val,path.concat(parentKey), event)
    }
    /**
     * 重写数组对象
     * @param data 
     * @param path 
     * @param event 
     */
    const Array = (data: any, path: string[], event: WatchCallbak) => {
        function Array(){
            data.forEach(v => this.push(v))
        }
        Array.prototype = []
        Array.prototype.constructor = Array;
        Array.prototype.push = function(val): number{
            const key = this.length
            val = createNewWatch(val, path, key, event)
            GlobalArray.prototype.push.call(this,val)
            defineProperty(this, key, val, path.concat(key), event)
            return key+1
        }
        Array.prototype.unshift = function(val): number{
            const key = this.length
            val = createNewWatch(val, path, key, event)
            GlobalArray.prototype.unshift.call(this,val)
            defineProperty(this, key, this[key], path.concat(key), event)
            return key+1
        }
        hiddenMethod(Array.prototype,'constructor')
        hiddenMethod(Array.prototype,'push')
        hiddenMethod(Array.prototype,'unshift')
        return new Array();
    }
    /**
     * 重写object对象
     * @param data 
     * @param path 
     * @param event 
     */
    const Object = (data: any, path: string[], event: WatchCallbak) => {
        function Object(){
            for(var key in data){
                this.set(key, data[key])
            }
        }
        Object.prototype.set =  function(key,val){
            //调用之前创建的函数，格式化val
            data[key] = createNewWatch(val, path, key, event)
            //创建对数据key的监听
            defineProperty(this, key, data[key], path.concat(key), event)
        }
        hiddenMethod(Object.prototype,'set')
        return new Object()
    }

    export const create = function(data: any, event: WatchCallbak = {}){
        return Object(data,[],event)
    }

}