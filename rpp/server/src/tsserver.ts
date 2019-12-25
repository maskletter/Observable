import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import tool from './tool';

export const files: Map<string,string> = new Map();

class TsLanguageService implements ts.LanguageServiceHost{

    constructor(rootFileNames: string[], options: ts.CompilerOptions){
        this.compilationSettings = options;
        rootFileNames.forEach(v => {
            this.addFile(v)
        })
    }
    public rootFileNames: Set<string> = new Set();
    private compilationSettings: ts.CompilerOptions;
    public files: ts.MapLike<{ version: number }> = {};
    public addFile(fileName: string){
        this.rootFileNames.add(fileName)
        this.files[fileName] = { version: 0 }
    }
    
    public removeFile(fileName: string){
      this.rootFileNames.delete(fileName);
      delete this.files[fileName]
    }
    fileExists = ts.sys.fileExists
    readFile = (path: string, en: any) => {
      
      return ts.sys.readFile(path,en)
    }
    readDirectory = ts.sys.readDirectory
    public getCompilationSettings(){
        return this.compilationSettings
    };
    public getScriptVersion(fileName: string){
        return this.files[fileName] && this.files[fileName].version.toString()
    }
    public getCurrentDirectory(): string{
        return tool.cwd;
    }
    public getDefaultLibFileName(options: ts.CompilerOptions): string{
        return path.join(tool.cwd,'node_modules/typescript/lib/lib.d.ts')
    }
    public getScriptFileNames(){
        return Array.from(this.rootFileNames)
    }
    public getScriptSnapshot(fileName: string){
        if (!fs.existsSync(fileName)) {
            return undefined;
        }
        return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
    }

}

export default class TsServer{

    constructor(rootFileNames: string[], options: ts.CompilerOptions, writeFile?: Function){
      writeFile && (this.writeFile = writeFile);
        this.host = new TsLanguageService(rootFileNames, options);
        this.services = ts.createLanguageService(
            this.host,
            ts.createDocumentRegistry()
          )
        this.host.getScriptFileNames().forEach(v => this.emitFile(v))
        this.isCarryOut = true;
        this.error()
    }

    private services: ts.LanguageService;
    private srcModulePath: string = path.normalize(path.join(tool.cwd,'src'))
    private isCarryOut: boolean = false;
    private host: TsLanguageService;
    private writeFile: Function;

    public addFile(file: string|string[]){
      file = file instanceof Array? file : [file]
      file.forEach(v => this.host.addFile(v));
      file.forEach(v => this.emitFile(v))
    }
    public removeFile(file: string|string[]){
      file = file instanceof Array? file : [file]
      file.forEach(v => this.host.removeFile(v))
    }
    public isPresence(fileName: string): boolean {
      return this.host.rootFileNames.has(fileName)
    }

    public emitFile(fileName: string) {
        this.host.files[fileName].version++;
        let output = this.services.getEmitOutput(fileName);
        if(this.isCarryOut) this.error()
        output.outputFiles.forEach(o => {
            if(this.writeFile) this.writeFile(o.name, o.text)
            else ts.sys.writeFile(o.name, o.text);
        });
    }

    public error(): void {
        ts.getPreEmitDiagnostics(this.services.getProgram()).forEach(diagnostic => {
          // console.log(diagnostic.file);
            if (diagnostic.file) {
              // if(path.normalize(diagnostic.file.fileName).indexOf(this.srcModulePath) == -1) return
              let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
                diagnostic.start!
              );
              let message = ts.flattenDiagnosticMessageText(
                diagnostic.messageText,
                "\n"
              );
              console.log(
                `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
              );
            } else {
              console.log(
                `${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`
              );
            }
        });
    }

    public logErrors(fileName: string) {
        let allDiagnostics = this.services
          .getCompilerOptionsDiagnostics()
          .concat(this.services.getSyntacticDiagnostics(fileName))
          .concat(this.services.getSemanticDiagnostics(fileName));
    
        allDiagnostics.forEach(diagnostic => {
          let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
          if (diagnostic.file) {
            let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
              diagnostic.start!
            );
            console.log(
              `  Error ${diagnostic.file.fileName} (${line + 1},${character +
                1}): ${message}`
            );
          } else {
            console.log(`  Error: ${message}`);
          }
        });
      }

}