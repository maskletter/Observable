// declare const h: any
import { getName } from './lib'
console.log(getName)
class Div{
    constructor(params:{ id?: string, style?:any }){}
}
class A{
    constructor(params:{ id?: string, style?:any }){}
}
class Br{
    constructor(params:{ id?: string, style?:any }){}
}
const color: string = 'red'
const n = <Div id="aaaaaaa" style={ {background:color} }></Div>

class TestPage {
    private bool: boolean = false;

    private navigator: any = <A>xxxxxxx</A>
    private school: string[] = ["北京大学","河北大学","xx大学"]
    private eachSchool() {
        return this.school.map(v => {
            return <A>v</A>
        })
    }
    private render(): void {
        const { school, eachSchool } = this;
        return <Div>
            { this.bool ? this.navigator : "xxxxxxxxx" }
            {school.map(v => {
                return <A>v</A>
            })}
            <Br />
            {eachSchool()}
        </Div>
    }

}