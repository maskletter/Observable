import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
/**
 * 工具类
 */
class tool{

    //系统运行当前路径
    public static cwd: string = process.cwd();

    public static tsconfig: ts.CompilerOptions = tool.getTsConfig();

    public static buildCwd: string = path.join(tool.cwd, tool.tsconfig.outDir)
    public static srcCwd: string = path.join(tool.cwd, tool.tsconfig.rootDir)

    public static fileType = {
        ts: /^(\s|\S)+(ts|tsx)+$/,
        css: /^(\s|\S)+(css|scss)+$/,
        img: /^(\s|\S)+(gif|jpg|jpeg|png|webp)+$/,
    }

    /**
     * 格式化标签View -> view
     * @param name 
     */
    public static FormatLabel(name: string): string{
        return name.replace(/['"]/g,'').replace(/[A-Z]/g, function(a: string,b: number,c: string,d: string){ return (b==0?'':'-')+a.toLocaleLowerCase() })
    }


    /**
     * 创建随机数
     * @param length 
     */
    public static createRandom(length = 10): string {
        let str = "",
            arr = [
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
            'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
        
        for (let i = 0; i < length; i++) {
            const pos = Math.round(Math.random() * (arr.length - 1));
            str += arr[pos];
        }
        return str;
        
    }

    /**
     * 格式化import包的路径
     * @param _path 
     */
    public static getImportPath(_path: string): string|undefined {
        const url = path.join(tool.srcCwd,_path)
        if(fs.existsSync(url)){
            if(fs.statSync(url).isDirectory()){
                return path.join(tool.srcCwd,_path,'index.ts')
                return path.join(_path,'index.ts')
            }
            return _path
        }else if(fs.existsSync(url+'.ts')){
            return path.join(tool.srcCwd,_path+'.ts')
        }else return undefined
    }

    /**
     * 获取tsconfig配置
     */
    public static getTsConfig(): any {
        const url: string = path.join(this.cwd,'tsconfig.json');
        if(!fs.existsSync(url)) {
            this.throw(new Error('tsconfig.json配置文件不存在'))
        }
        const content: string = fs.readFileSync(url, { encoding: 'utf-8' });
        const module2: any = {
            none: 'None',
            commonjS: 'CommonJS',
            amd: 'AMD',
            umd: 'UMD',
            system: 'System',
            es2015: 'ES2015',
            esnext: 'ESNext'
        }
        const jsxModule: any = {
            'react': ts.JsxEmit.React,
            'react-native': ts.JsxEmit.ReactNative,
            'preserve': ts.JsxEmit.Preserve
        }
        try {
            const config: ts.CompilerOptions = JSON.parse(content).compilerOptions;
            if(config.target) config.target = <any>ts.ScriptTarget[(config.target as any).toLocaleUpperCase()];
            if(config.lib){
                // config.lib = config.lib.map(v => path.join(tool.cwd,'node_modules/typescript/lib','lib.'+v+'.d.ts'))
                config.lib = config.lib.map(v => 'lib.'+v+'.d.ts')
            }
            if(config.jsx){
                config.jsx = jsxModule[config.jsx]
            }
            if(config.module){
                const moduleName: string =config.module as any
                config.module = <any>ts.ModuleKind[module2[moduleName]]
            }
            if(config.moduleResolution){
                config.moduleResolution = (config.moduleResolution as any) == 'node' ? ts.ModuleResolutionKind.NodeJs : ts.ModuleResolutionKind.Classic
            }
            // if(config.typeRoots){
            //     config.typeRoots = config.typeRoots.map(v => path.join(tool.cwd,v));
            // }
            return config
        } catch (error) {
            this.throw(error)
        }
    }

    /**
     * 读取目录内的文件/文件夹
     * @param url 
     */
    public static getDirectory(url: string): { [prop: string]: { type: 'floder'|'file', value: string } }{
        if(!fs.existsSync(url)) return {}
        let data: string[] = fs.readdirSync(url);
        const result: any = {};
        data.forEach(v => {
            let stats = fs.statSync(path.join(url,v));
            if(stats.isDirectory()) result[v] = { type: 'floder', value: v };
            else{
                const key: string = v.replace(/^(.+?)(.ts)$/,'$1')
                result[key] = { type: 'file', value: v }
            }
        })
        return result
    }
    /**
     * 创建目录
     * @param dirname 
     */
    public static mkdirSync(dirname: string){
        if (fs.existsSync(dirname)) {  
            return true;  
        } else {  
            if (tool.mkdirSync(path.dirname(dirname))) {  
                fs.mkdirSync(dirname);  
                return true;  
            }  
        }  
    }

    /**
     * 错误处理
     */
    private static throw(error: Error): void {
        console.log(error);
    }

}

export default tool