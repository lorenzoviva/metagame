const {Parser} = require('acorn');
const cloneDeep = require('lodash/fp/cloneDeep');
const classFields = require('acorn-class-fields');

var classes = {}
class Code{
    constructor(code, node=null, parent=null) {
        var text_code = "";
        if(typeof code === "string"){
            text_code = code;
        }else if(typeof code === "function"){
            text_code = code.toString();
        }
        var root = node;
        if(node === null){
            root = Parser.extend(classFields).parse(text_code);
        }
        // console.log("parsed: ", root);
        this.jsToAST(root, text_code, parent);
        // console.log("AST: ", this);
        this.ASTToFlowChart();
        // console.log("FC: ", this);
        this.staticAnalisys();
        // console.log("SA: ", this);
        // this.code = text_code;
        this.visualize = 'flowchart';

        var dependencies = this.getDependencies();
        this.dependencies = [];
        for (var node_i = 0; node_i < dependencies.length; node_i++) {
            var dependencyNode = dependencies[node_i];
            var dependency = Module.localURLToGlobal(dependencyNode.node.code);
            this.dependencies.push(dependency);
        }

    }
    staticAnalisys(){
        this.sa_identifiers = {}
        for(var child_i = 0; child_i < this.child.length; child_i++){
            let child_ast = this.child[child_i];
            let child_type = child_ast.node.type;
            let items = child_ast.staticAnalisys().sa_identifiers;
            if(child_type === "Identifier"){// || child_type === "Literal" || child_type === "ThisExpression"
                if(this.sa_identifiers[child_ast.node.code] === undefined || this.sa_identifiers[child_ast.node.code].constructor.name !== 'Array'){//this.sa_identifiers.hasOwnProperty(child_ast.node.code)
                    this.sa_identifiers[child_ast.node.code] = []
                }
                this.sa_identifiers[child_ast.node.code].push(child_ast);

            }else{
                let newidentifiers = Object.getOwnPropertyNames(items);
                for (var id_i = 0; id_i < newidentifiers.length; id_i++){
                    if (this.sa_identifiers[newidentifiers[id_i]] === undefined || this.sa_identifiers[newidentifiers[id_i]].constructor.name !== 'Array') {//!this.sa_identifiers.hasOwnProperty(newidentifiers[id_i])
                        this.sa_identifiers[newidentifiers[id_i]] = []
                    }
                    this.sa_identifiers[newidentifiers[id_i]].push(...items[newidentifiers[id_i]]);
                    // this.sa_identifiers[items[newidentifiers[id_i]].node.code].push(items[id_i]);

                }
            }
        }
        return this;
    }

    ASTToFlowChart(){
        this.fc_params = [];
        this.fc_child = [];
        for(var child_i = 0; child_i < this.child.length; child_i++){
            let child_type = this.child[child_i].node.type;
            if(child_type === "Identifier" || child_type === "Literal" || child_type === "ThisExpression"){
                this.fc_params.push(this.child[child_i].ASTToFlowChart());
            }else{
                this.fc_child.push(this.child[child_i].ASTToFlowChart());
            }
        }
        this.skipAST4FC();
        return this;
    }
    skipAST4FC(){
        if(this.fc_child.length === 1){
            // this.fc_params = [];
            for(var child_i = 0; child_i < this.child.length; child_i++){
                let child_ast = this.child[child_i];
                let child_type = child_ast.node.type;
                if(child_type !== "Identifier" && child_type !== "Literal" && child_type !== "ThisExpression"){
                    var skipped_child = child_ast.skipAST4FC();
                    this.fc_params.splice(child_i, 0, ...skipped_child.fc_params)
                    this.fc_child = skipped_child.fc_child;
                }
            }
        }
        return this;
    }

    getRoot() {
        if(this.parent !== null){
            return this.parent.getRoot();
        } else{
            return this;
        }
    }
    jsToAST(node, code, parent=null){
        node.code = code.substr(node.start, node.end-node.start)
        this.node = node
        this.child = [];
        this.type = node.type;
        this.parent = parent;
        for (var key in Object.keys(node)){
            let child = node[Object.keys(node)[key]];
            if(child === null || child === undefined){
                // console.log("child: ", child, key, node)
            }else if (child.constructor.name === "Node"){
                // this.child.push(new Code(code, child, this))
                this.child.push(Code.createCode(code, child, this))
            }else if(child.constructor.name === "Array"){
                for (var i = 0; i < child.length; i++){
                    // this.child.push(new Code(code, child[i], this))
                    this.child.push(Code.createCode(code, child[i], this))
                }
            }
        }
    }

    getDependencies(){
        var dependencies = [];
        var ast_type = this.node.type;
        for(var child_i = 0; child_i < this.child.length; child_i++){
            let child_ast = this.child[child_i];
            let child_type = child_ast.node.type;
            if(ast_type === "CallExpression" && child_type === "Identifier" && child_ast.node.code === "require"){
                dependencies.push(this.child[child_i+1])
            }
            dependencies.push(...child_ast.getDependencies())
        }
        return dependencies;
    }
    static cutHeadNode(code){
        if(code.child.length === 1){
            var parent = code.parent;
            code = code.child[0]
            code.parent = parent;
        }
        return code;
    }
    static editCode(newCode, oldCode = null, parent = null){
        if(oldCode !== null){

        }
    }
    static createCode(code, node = null, parent = null){
        if(node !== null){
            if(classes.hasOwnProperty(node.type)){
                return new classes[node.type](code, node, parent);
            }
        }
        return new Code(code, node, parent);
    }


}
class VariableDeclaration extends Code {
    constructor(code, node = null, parent = null) {
        super(code, node, parent);
    }
    getVariableIdentifiers() {
        var identifiers = [];
        for( var i = 0; i < this.child.length; i++){
            var child = this.child[i];
            if(child.node.type === "VariableDeclarator"){
                identifiers.push(child.fc_params[0].node.code)
            }
        }
        return identifiers;
    }
}
classes.VariableDeclaration = VariableDeclaration
class ExpressionStatement extends Code{
    constructor(code, node = null, parent = null) {
        super(code, node, parent);
    }
}
classes.ExpressionStatement = ExpressionStatement
class ClassDeclaration extends Code{
    constructor(code, node = null, parent = null) {
        super(code, node, parent);
    }
    getDeclaredClassName(){
        return this.fc_params[0].node.code;
    }
}
classes.ClassDeclaration = ClassDeclaration
class FunctionDeclaration extends Code{
    constructor(code, node = null, parent = null) {
        super(code, node, parent);
    }
    getDeclaredFunctionName(){
        return this.fc_params[0].node.code;
    }
}
classes.FunctionDeclaration = FunctionDeclaration

classes.Code = Code;
class Module extends Code{
    constructor(code, reference) {
        super(code);

        this.node.reference = reference;
    }
    static localURLToGlobal(url){
        return url.replaceAll("'","").replaceAll("\"","").replaceAll("./","/src/")
    }
}
classes.Module = Module;


class Relation{
    constructor(from, to, shape, identifier) {
        this.from = from;
        this.to = to;
        this.shape = shape;
        this.identifier = identifier;
    }
}
classes.Relation = Relation;

class Color {
    constructor() {
        this.r = 0;
        this.g = 0;
        this.b = 0;
    }
    random(){
        this.r = Math.floor(Math.random()*256)
        this.g = Math.floor(Math.random()*256)
        this.b = Math.floor(Math.random()*256)
        return this;
    }
    randomLight(){
        this.r = Math.floor(128+Math.random()*128)
        this.g = Math.floor(128+Math.random()*128)
        this.b = Math.floor(128+Math.random()*128)
        return this;
    }
    randomDark(){
        this.r = Math.floor(Math.random()*128)
        this.g = Math.floor(Math.random()*128)
        this.b = Math.floor(Math.random()*128)
        return this;
    }
    lighter(alpha = 0.1){
        this.r += Math.floor(alpha*(256-this.r))
        this.g += Math.floor(alpha*(256-this.g))
        this.b += Math.floor(alpha*(256-this.b))
        return this;
    }
    darker(alpha) {
        this.r -= Math.floor(alpha*this.r)
        this.g -= Math.floor(alpha*this.g)
        this.b -= Math.floor(alpha*this.b)
        return this;
    }
    opposite(){
        this.r = Math.floor(256-this.r)
        this.g = Math.floor(256-this.g)
        this.b = Math.floor(256-this.b)
        return this;
    }
    toString(){
        return "rgb(" + this.r + ", " + this.b + ", " + this.g + ")"
    }
}
classes.Color = Color;
module.exports = classes;