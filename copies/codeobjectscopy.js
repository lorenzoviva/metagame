const {Parser} = require('acorn');
const cloneDeep = require('lodash/fp/cloneDeep');
const classFields = require('acorn-class-fields');

var classes = {}
class Code{
    constructor(code) {
        var text_code = "";
        if(typeof code === "string"){
            text_code = code;
        }else if(typeof code === "function"){
            text_code = code.toString();
        }
        var root = Parser.extend(classFields).parse(text_code);
        console.log("parsed: ", root);
        var ast = Code.jsToAST(root, text_code);
        console.log("AST: ", ast);
        ast = Code.ASTToFlowChart(ast);
        console.log("FC: ", ast);
        ast = Code.staticAnalisys(ast);
        console.log("SA: ", ast);
        this.code = text_code;
        this.ast = ast;
        this.visualize = 'flowchart';
    }
    static staticAnalisys(ast){
        ast.sa_identifiers = {}
        for(var child_i = 0; child_i < ast.child.length; child_i++){
            let child_ast = ast.child[child_i];
            let child_type = child_ast.node.type;
            let items = Code.staticAnalisys(child_ast).sa_identifiers;
            if(child_type === "Identifier"){// || child_type === "Literal" || child_type === "ThisExpression"
                if(ast.sa_identifiers[child_ast.node.code] === undefined || ast.sa_identifiers[child_ast.node.code].constructor.name !== 'Array'){//ast.sa_identifiers.hasOwnProperty(child_ast.node.code)
                    ast.sa_identifiers[child_ast.node.code] = []
                }
                ast.sa_identifiers[child_ast.node.code].push(child_ast);

            }else{
                let newidentifiers = Object.getOwnPropertyNames(items);
                for (var id_i = 0; id_i < newidentifiers.length; id_i++){
                    if (ast.sa_identifiers[newidentifiers[id_i]] === undefined || ast.sa_identifiers[newidentifiers[id_i]].constructor.name !== 'Array') {//!ast.sa_identifiers.hasOwnProperty(newidentifiers[id_i])
                        ast.sa_identifiers[newidentifiers[id_i]] = []
                    }
                    ast.sa_identifiers[newidentifiers[id_i]].push(...items[newidentifiers[id_i]]);
                    // ast.sa_identifiers[items[newidentifiers[id_i]].node.code].push(items[id_i]);

                }
            }
        }
        return ast;
    }

    static ASTToFlowChart(ast){
        ast.fc_params = [];
        ast.fc_child = [];
        for(var child_i = 0; child_i < ast.child.length; child_i++){
            let child_type = ast.child[child_i].node.type;
            if(child_type === "Identifier" || child_type === "Literal" || child_type === "ThisExpression"){
                ast.fc_params.push(Code.ASTToFlowChart(ast.child[child_i]));
            }else{
                ast.fc_child.push(Code.ASTToFlowChart(ast.child[child_i]));
            }
        }
        ast = Code.skipAST4FC(ast);
        return ast;
    }
    static skipAST4FC(ast){
        if(ast.fc_child.length === 1){
            // ast.fc_params = [];
            for(var child_i = 0; child_i < ast.child.length; child_i++){
                let child_ast = ast.child[child_i];
                let child_type = child_ast.node.type;
                if(child_type !== "Identifier" && child_type !== "Literal" && child_type !== "ThisExpression"){
                    var skipped_child = Code.skipAST4FC(child_ast);
                    ast.fc_params.splice(child_i, 0, ...skipped_child.fc_params)
                    ast.fc_child = skipped_child.fc_child;
                }
            }
        }
        return ast;
    }
    static jsToAST(node, code, parent=null){
        node.code = code.substr(node.start, node.end-node.start)
        var result = {node: node, child: [], type: node.type, parent: parent, getRoot: function () {if(this.parent !== null){return this.parent.getRoot();} else{return this;}}}
        for (var key in Object.keys(node)){
            let child = node[Object.keys(node)[key]];
            if(child === null){
                // console.log("child: ", child, key, node)
            }else if (child.constructor.name === "Node"){
                result.child.push(Code.jsToAST(child, code, result))
            }else if(child.constructor.name === "Array"){
                for (var i = 0; i < child.length; i++){
                    result.child.push(Code.jsToAST(child[i],code, result))
                }
            }
        }

        return result;
    }



}
classes.Code = Code;
class Module extends Code{
    constructor(code, reference) {
        super(code);
        this.dependencies = Module.dependenciesFromAST(this.ast);
        this.ast.node.reference = reference;
    }
    static dependenciesFromAST(ast){
        var dependencies = [];
        var ast_type = ast.node.type;
        for(var child_i = 0; child_i < ast.child.length; child_i++){
            let child_ast = ast.child[child_i];
            let child_type = child_ast.node.type;
            if(ast_type === "CallExpression" && child_type === "Identifier" && child_ast.node.code === "require"){
                dependencies.push(ast.child[child_i+1])
            }
            dependencies.push(...Module.dependenciesFromAST(child_ast))
        }
        return dependencies;
    }
    getDependencyURLList(){
        var deps = [];
        for (var node_i = 0; node_i < this.dependencies.length; node_i++) {
            var dependencyNode = this.dependencies[node_i];
            var dependency = Module.localURLToGlobal(dependencyNode.node.code);
            deps.push(dependency);
        }
        return deps;
    }
    static localURLToGlobal(url){
        return url.replaceAll("'","").replaceAll("\"","").replaceAll("./","/src/")
    }
}
classes.Module = Module;
module.exports = classes;