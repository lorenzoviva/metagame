const {Parser} = require('acorn');
const cloneDeep = require('lodash/fp/cloneDeep');
const classFields = require('acorn-class-fields');
var GLTFLoader = require("three-gltf-loader");
let geval = this.execScript || eval;
var classes = {};


function createRealObject(object, position, type=RealObject.constructor){
    var realObject = null;
    if(type !== RealObject.constructor){
        realObject = type();
        realObject.setObject(object);
        realObject.setPositionGrid(position)
        realObject.put(scene);
    }else{
        var objectType = "";
        if(object === undefined){
            objectType = "Undefined3D"
        }else if(object === null){
            objectType = "Null3D"
        }else{
            objectType = object.constructor.name + "3D"
        }
        try{
            realObject = new classes[objectType](object);
            realObject.setPositionGrid(position)
            // realObject.setObject(object)
        } catch (e) {
            if(e instanceof TypeError){
                let color = 'rgb('+Math.floor(128+Math.random()*128)+","+Math.floor(128+Math.random()*128)+","+Math.floor(128+Math.random()*128)+")"
                let C = class extends RealObject{
                    constructor(object){
                        var mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),  new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.8, emissive: color, color: color}))
                        super(objectType, objectType, {},{},[],object, mesh);
                        this.setPositionInternal(new THREE.Vector3(0.5,0.5,0.5))
                    }
                };
                Object.defineProperty (C, 'name', {value: objectType});
                classes[objectType] = C;
                console.log("Creating obj: " + objectType);
                return createRealObject(object, position, type);
            }else{
                console.log("ERROR: ",  e)
                return createRealObject(e, position, type);
            }
        }

    }
    realObject.put(scene);
}

class RealObject{
    name = "";
    common_name = "";
    animations = {};
    actions = {};
    controls = [];

    object = null;

    mesh = null;

    constructor(name = "", common_name = "", animations = {}, actions = {}, controls = [], object = null, mesh = null) {
        this.setName(name);
        this.common_name = common_name;
        this.animations = animations;
        this.actions = actions;
        this.controls = controls;

        this.setObject(object);

        this.setMesh(mesh);
        objects.push(this)
    }
    destroyer(){
        scene.remove(this.mesh);
        objects.splice(objects.indexOf(this),1)
        delete window[this.name];
        delete this;
    }
    setName(name){
        if (typeof name === 'string' && name.length > 0){
            this.name = name + "_" + THREE.MathUtils.generateUUID().replaceAll("-","_");
            window[this.name] = this;
        }
    }

    setMesh(mesh){
        this.mesh = mesh;
        if(this.mesh) this.meshSetup();
    }

    meshSetup(){
        this.mesh.userData.realObject = this;
    }
    getPosition(){
        return this.mesh.position;
    }
    getPositionGrid(){
        if(!this.mesh.hasOwnProperty("positionGrid")){
            this.mesh.positionGrid =  THREE.Vector3(0,0,0);
        }
        return this.mesh.positionGrid;
    }
    getPositionInternal(){
        if(!this.mesh.hasOwnProperty("positionInternal")){
            this.mesh.positionInternal =  THREE.Vector3(0,0,0);
        }
        return this.mesh.positionInternal;
    }
    setPositionGrid(new_position){
        if(!this.mesh.hasOwnProperty("positionInternal")){
            this.mesh.positionInternal = new THREE.Vector3(0,0,0);
        }
        this.mesh.positionGrid = new_position;
        this.mesh.position.x =  this.mesh.positionGrid.x + this.mesh.positionInternal.x
        this.mesh.position.y =  this.mesh.positionGrid.y + this.mesh.positionInternal.y
        this.mesh.position.z =  this.mesh.positionGrid.z + this.mesh.positionInternal.z
    }
    setPositionInternal(new_position){
        if(!this.mesh.hasOwnProperty("positionGrid")){
            this.mesh.positionGrid = new THREE.Vector3(0,0,0);
        }
        this.mesh.positionInternal = new_position;
        this.mesh.position.x =  this.mesh.positionGrid.x + this.mesh.positionInternal.x
        this.mesh.position.y =  this.mesh.positionGrid.y + this.mesh.positionInternal.y
        this.mesh.position.z =  this.mesh.positionGrid.z + this.mesh.positionInternal.z
    }
    setObject(object){
        this.object = object;
        if(this.object) this.objectSetup();
    }

    objectSetup(){

    }

    put(scene){
        scene.add( this.mesh );
    }
    async loadGLTFMesh(url){
        var loader = new GLTFLoader();
        const gltf = await loader.loadAsync(url);
        this.mesh = gltf.scene;
    }
}
class CodeLink extends RealObject{
    constructor(link) {
        let lineCurve = null;
        let v0 = link.from.getPosition();
        let v1 = link.to.getPosition();
        if(link.shape === "arc"){
            let height = 5;
            // let height = v0.distanceTo(v1);
            let p0 = new THREE.Vector3(v0.x,v0.y + height, v0.z);
            let p1 = new THREE.Vector3(v1.x,v1.y + height, v1.z);
            lineCurve = new THREE.CubicBezierCurve3(v0, p0, p1, v1);
        }else{
            lineCurve = new THREE.LineCurve(v0, v1);

        }

        let tubeGeometry = new THREE.TubeGeometry(lineCurve, 20, 0.01, 8, false );
        let material = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.8, emissive: link.color, color: link.color});
        let mesh = new THREE.Mesh(tubeGeometry, material);
        // var curve = new THREE.EllipseCurve(
        //     0, 0,             // ax, aY
        //     7, 15,            // xRadius, yRadius
        //     0, 3/2 * Math.PI, // aStartAngle, aEndAngle
        //     false             // aClockwise
        // );
        //
        // var points = curve.getSpacedPoints( 20 );
        //
        // var path = new THREE.Path();
        // var geometry = path.createGeometry( points );
        //
        // var material = new THREE.LineBasicMaterial( { color : c } );
        //
        // var mesh = new THREE.Line( geometry, material );

        super(link.from.name+"-"+link.to.name,link.from.common_name+"-"+link.to.common_name,{},{},[], link, mesh);
    }
}
class CodeBlock extends RealObject{
    constructor(code){
        super();
        this.setObject(code);

        this.setName(this.object.ast.type);
        this.common_name = this.object.ast.type;
        this.animations = {};
        this.actions = {'Hide flowchart':this.opt_clearFC, 'Show flowchart':this.opt_FCTo3D, 'Hide AST':this.opt_clearAST, 'Show AST':this.opt_ASTTo3D, "Edit code": this.opt_editText, "Show connections":this.opt_showConnections,"Show dependencies":this.opt_showDependencies, "Fire":this.opt_execute};
        this.controls = [];
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),  CodeBlock.getTextMaterial(this.object.ast.node))
        this.setMesh(mesh);
        this.setPositionInternal(new THREE.Vector3(0.5,0.5,0.5))

        this.links = [];
        this.sa_links = [];
        this.dependency_links = [];
        this.ast_child = [];
        this.fc_child = [];
        this.fc_param = [];
    }
    destroyer() {
        // this.links= []
        // this.sa_links = [];
        for(var link_i = 0; link_i < this.links.length; link_i++){
            this.links[link_i].destroyer();
            // scene.remove(this.links[link_i].mesh);
        }
        this.links = [];
        for(var sa_link_i = 0; sa_link_i < this.sa_links.length; sa_link_i++){
            this.sa_links[sa_link_i].destroyer();
            // scene.remove(this.links[link_i].mesh);
        }
        this.sa_links = [];
        for(var de_link_i = 0; de_link_i < this.dependency_links.length; de_link_i++){
            this.dependency_links[de_link_i].destroyer();
            // scene.remove(this.links[link_i].mesh);
        }
        this.dependency_links = [];
        super.destroyer();
    }

    objectSetup() {
        super.objectSetup();
        if(typeof this.object === "string"){
            var root = Parser.extend(classFields).parse(this.object);
            console.log("parsed: ", root);
            var ast = CodeBlock.jsToAST(root, this.object);
            console.log("AST: ", ast);
            var dependencies = CodeBlock.dependenciesFromAST(ast)
            ast = CodeBlock.ASTToFlowChart(ast);
            console.log("FC: ", ast);
            ast = CodeBlock.staticAnalisys(ast);
            console.log("SA: ", ast);
            ast.realObject = this
            this.object = {code:this.object, ast: ast, dependencies: dependencies, visualize: 'flowchart'}
        }

    }

    opt_ASTTo3D(){
        if(this.fc_param.length === 0 && this.fc_child.length === 0 && this.ast_child.length === 0){
            return this.ASTTo3D;
        }else{
            return null;
        }
    }
    ASTTo3D(initial_position= this.getPositionGrid()){

        this.setPositionGrid(initial_position)
        this.put(scene);
        this.object.ast.realObject = this;
        let right_most_x = initial_position.x;
        let last_child_position = new THREE.Vector3(right_most_x , initial_position.y, initial_position.z-2);
        for(var child_i = 0; child_i < this.object.ast.child.length; child_i++){
            last_child_position = new THREE.Vector3(right_most_x + (child_i > 0?2:0), last_child_position.y, last_child_position.z);
            var child_object = new CodeBlock({code:this.object.ast.child[child_i].node.code, ast: this.object.ast.child[child_i], visualize: 'ast'});//{code: this.object.ast.code, ast: this.object.ast.child[child_i]}
            child_object.mesh.rotation.setFromVector3(this.mesh.rotation);
            let bounds = child_object.ASTTo3D(last_child_position.getRotated(child_object.mesh.rotation));
            right_most_x = right_most_x<bounds?bounds:right_most_x;
            this.ast_child.push(child_object);
            var link = new CodeLink({from: this, to: child_object, color: 'rgb(12,25,96)'});
            link.put(scene);
            this.links.push(link);
        }
        return right_most_x
    }
    opt_clearAST(){
        if(this.ast_child.length > 0){
            return this.clearAST;
        }else{
            return null;
        }
    }
    clearAST(){
        for(var child_i = 0; child_i < this.ast_child.length; child_i++){
            this.ast_child[child_i].clearAST();
            this.ast_child[child_i].destroyer();
        }
        for(var link_i = 0; link_i < this.links.length; link_i++){
            this.links[link_i].destroyer();
        }
        this.links = [];
        for(var sa_link_i = 0; sa_link_i < this.sa_links.length; sa_link_i++){
            this.sa_links[sa_link_i].destroyer();
        }
        this.sa_links = [];
        this.ast_child = [];

    }
    opt_FCTo3D(){
        if(this.fc_param.length === 0 && this.fc_child.length === 0 && this.ast_child.length === 0){
            return this.FCTo3D;
        }else{
            return null;
        }
    }
    FCTo3D(initial_position= this.getPositionGrid()){

        this.setPositionGrid(initial_position)
        this.put(scene);
        this.object.ast.realObject = this;
        let right_most_x = initial_position.x;
        let last_child_position = new THREE.Vector3(right_most_x , initial_position.y, initial_position.z);
        // if(this.object.ast.node.code.split(/\r\n|\r|\n/).length > 2)//!this.object.ast.type.endsWith("Expression") && && !this.object.ast.type.endsWith("Statement")
        for(var param_i = 0; param_i < this.object.ast.fc_params.length; param_i++){
            last_child_position = new THREE.Vector3(right_most_x, last_child_position.y, last_child_position.z - 2);
            var param_object = new CodeBlock({code:this.object.ast.fc_params[param_i].node.code, ast: this.object.ast.fc_params[param_i], visualize: 'flowchart'});
            param_object.mesh.rotation.setFromVector3(this.mesh.rotation);

            param_object.FCTo3D(last_child_position.getRotated(param_object.mesh.rotation));
            this.fc_param.push(param_object);
            var link1 = new CodeLink({from: this, to: param_object, color: 'rgb(12,96,27)'});
            link1.put(scene);last_child_position
            this.links.push(link1);
        }
        last_child_position = new THREE.Vector3(right_most_x , initial_position.y, initial_position.z - 2);
        for(var child_i = 0; child_i < this.object.ast.fc_child.length; child_i++){
            last_child_position = new THREE.Vector3(right_most_x + 2, last_child_position.y, last_child_position.z);
            var child_object = new CodeBlock({code:this.object.ast.fc_child[child_i].node.code, ast: this.object.ast.fc_child[child_i], visualize: 'flowchart'});
            child_object.mesh.rotation.setFromVector3(this.mesh.rotation);
            let bounds = child_object.FCTo3D(last_child_position.getRotated(child_object.mesh.rotation));
            right_most_x = right_most_x<bounds?bounds:right_most_x;
            this.fc_child.push(child_object);
            var link = new CodeLink({from: this, to: child_object, color: 'rgb(12,25,96)'});
            link.put(scene);
            this.links.push(link);
        }
        return right_most_x
    }
    opt_clearFC(){
        if(this.fc_param.length > 0 || this.fc_child.length > 0){
            return this.clearFC;
        }else{
            return null;
        }
    }
    clearFC(){
        for(var child_i = 0; child_i < this.fc_child.length; child_i++){
            this.fc_child[child_i].clearFC();
            this.fc_child[child_i].destroyer();
            // scene.remove(this.fc_child[child_i].mesh);
        }
        this.fc_child = [];
        for(var param_i = 0; param_i < this.fc_param.length; param_i++){
            this.fc_param[param_i].clearFC();
            this.fc_param[param_i].destroyer();
        }
        this.fc_param = [];
        for(var link_i = 0; link_i < this.links.length; link_i++){
            this.links[link_i].destroyer();
        }
        this.links = [];
        for(var sa_link_i = 0; sa_link_i < this.sa_links.length; sa_link_i++){
            this.sa_links[sa_link_i].destroyer();
        }
        this.sa_links = [];
    }

    opt_editText(){
        return this.editText;
    }
    editText(){
        interfaces.showTextEditor(this);
    }
    opt_execute(){
        return this.execute;
    }
    execute(){
        var result = null;
        try {
           result = geval(this.object.code)
        } catch (e) {
            result = e;
        }

        createRealObject(result, new THREE.Vector3(this.getPositionGrid().x,this.getPositionGrid().y+1,this.getPositionGrid().z));
    }
    editCode(newCode){
        let ast = this.object.ast;
        let root = ast.getRoot();
        var rootObject = root.realObject;
        var overwritten = root.node.code.substr(0,ast.node.start) + newCode + root.node.code.substr(ast.node.end, root.node.code.length - ast.node.end);
        rootObject.setObject(overwritten);
        var redoAST = rootObject.opt_clearAST();
        var redoFC = rootObject.opt_clearFC();
        if(redoAST !== null){
            redoAST.apply(rootObject);
            rootObject.ASTTo3D();
        }else if (redoFC !== null){
            redoFC.apply(rootObject);
            rootObject.FCTo3D();
        }
        this.mesh.material = CodeBlock.getTextMaterial(this.object.ast.node);
    }
    opt_showConnections(){
        if(this.fc_param.length > 0 || this.fc_child.length > 0 || this.ast_child.length > 0){
            return this.visualizeStaticAnalisys;
        }else{
            return null;
        }
    }
    visualizeStaticAnalisys(){
        let identifiersNode = this.object.ast.sa_identifiers;
        let identifiers = Object.getOwnPropertyNames(identifiersNode);
        for (var id_i = 0; id_i < identifiers.length; id_i++){
            var identifier = identifiers[id_i]
            for (var usage_i = 0; usage_i < identifiersNode[identifier].length; usage_i++){
                let usage = identifiersNode[identifier][usage_i];
                let parent_type = usage.parent.node.type;
                let color = 'rgb('+Math.floor(128+Math.random()*128)+","+Math.floor(128+Math.random()*128)+","+Math.floor(128+Math.random()*128)+")"
                if (parent_type === "Property"|| parent_type === "VariableDeclarator") {
                    for (var other_usage_i = 0; other_usage_i < identifiersNode[identifier].length; other_usage_i++) {
                        let other_usage = identifiersNode[identifier][other_usage_i];
                        if (usage !== other_usage) {
                            var usagelink = new CodeLink({from: usage.realObject, shape: "arc", to: other_usage.realObject, color: color})
                            this.sa_links.push(usagelink)
                            usagelink.put(scene);
                        }
                    }
                    break;
                }
            }
        }
    }
    opt_showDependencies(){
        if(this.fc_param.length > 0 || this.fc_child.length > 0 || this.ast_child.length > 0){
            return this.showDependencies;
        }else{
            return null;
        }
    }
    showDependencies(){
        let dependencyNodes = this.object.dependencies;
        for (var node_i = 0; node_i < dependencyNodes.length; node_i++){
            var dependencyNode = dependencyNodes[node_i];
            var dependency = dependencyNode.node.code.replaceAll("'","").replaceAll("\"","").replaceAll("./","");
            let color = 'rgb('+Math.floor(128+Math.random()*128)+","+Math.floor(128+Math.random()*128)+","+Math.floor(128+Math.random()*128)+")"

            for (var obj_i = 0; obj_i < objects.length; obj_i++){
                var object = objects[obj_i];
               if(object.constructor.name === CodeBlock.name && object.reference !== undefined && object.reference === dependency){
                   var dep_link = new CodeLink({from: this, shape: "arc", to: object, color: color})
                   this.dependency_links.push(dep_link)
                   dep_link.put(scene);
               }
            }
        }
    }

    static staticAnalisys(ast){
        ast.sa_identifiers = {}
        for(var child_i = 0; child_i < ast.child.length; child_i++){
            let child_ast = ast.child[child_i];
            let child_type = child_ast.node.type;
            let items = CodeBlock.staticAnalisys(child_ast).sa_identifiers;
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

    // async staticAnalisys(){
    //     if(this.object.ast.type === "Identifier"){
    //         // var ast_root = this.object.ast.getRoot();
    //         // console.log("IDENTIFIER NODE: ", this.object.ast.node.code, this.object.ast.parent.type)
    //         if(this.object.ast.parent.type === "Property" || this.object.ast.parent.type === "VariableDeclarator"){
    //             var variable = new CodeBlock(this.object.ast)
    //             await variable.loadGLTFMesh("/models/switch.glb")
    //             variable.mesh.position.x = this.mesh.position.x;
    //             variable.mesh.position.y = this.mesh.position.y+0.3;
    //             variable.mesh.position.z = this.mesh.position.z;
    //             variable.mesh.scale.x *= 0.03;
    //             variable.mesh.scale.y *= 0.03;
    //             variable.mesh.scale.z *= 0.03;
    //             this.sa_child.push(variable)
    //             variable.put(scene);
    //
    //         }
    //     }
    //     for (var i = 0 ; i < this.ast_child.length; i++){
    //         this.ast_child[i].staticAnalisys()
    //     }
    // }
    static ASTToFlowChart(ast){
        ast.fc_params = [];
        ast.fc_child = [];
        for(var child_i = 0; child_i < ast.child.length; child_i++){
            let child_type = ast.child[child_i].node.type;
            if(child_type === "Identifier" || child_type === "Literal" || child_type === "ThisExpression"){
                ast.fc_params.push(CodeBlock.ASTToFlowChart(ast.child[child_i]));
            }else{
                ast.fc_child.push(CodeBlock.ASTToFlowChart(ast.child[child_i]));
            }
        }
        ast = CodeBlock.skipAST4FC(ast);
        return ast;
    }
    static skipAST4FC(ast){
        if(ast.fc_child.length === 1){
            // ast.fc_params = [];
            for(var child_i = 0; child_i < ast.child.length; child_i++){
                let child_ast = ast.child[child_i];
                let child_type = child_ast.node.type;
                if(child_type !== "Identifier" && child_type !== "Literal" && child_type !== "ThisExpression"){
                    var skipped_child = CodeBlock.skipAST4FC(child_ast);
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
                result.child.push(CodeBlock.jsToAST(child, code, result))
            }else if(child.constructor.name === "Array"){
                for (var i = 0; i < child.length; i++){
                    result.child.push(CodeBlock.jsToAST(child[i],code, result))
                }
            }
        }

        return result;
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
            dependencies.push(...CodeBlock.dependenciesFromAST(child_ast))
        }
        return dependencies;
    }

    static getTextMaterial(node) {
        var canvas1 = document.createElement("canvas");
        var canvas2 = document.createElement("canvas");
        var context1 = canvas1.getContext("2d");
        var context2 = canvas2.getContext("2d");
        // console.log(console);

        context1.font = "25pt Source arial, sans-serif";
        context1.textAlign = "center";
        context1.fillStyle = "rgb(39, 66, 21)";

        context2.font = "25pt Source arial, sans-serif";
        context2.textAlign = "center";
        context2.fillStyle = "rgb(255, 102, 0)";

        let w = 600;
        let h = 600;
        var x = canvas1.width / 2;
        var y = canvas1.height / 2;

        context1.fillRect(0, 0, w, h);
        context2.fillRect(0, 0, w, h);

        context1.fillStyle = 'rgb(255, 102, 0)';
        context1.fillText(node.type, x, y);
        context2.fillStyle = 'rgb(12,25,96)';
        context2.fillText(node.code, x, y);
        var texture1 = new THREE.Texture(canvas1);
        var texture2 = new THREE.Texture(canvas2);
        texture1.needsUpdate = true;
        texture2.needsUpdate = true;
        var materials = [];
        let parameters = { transparent: true, opacity: 0.8, emissive: 'rgb(12,25,96)', color: "rgb(12,25,96)"};
        materials.push(new THREE.MeshLambertMaterial(parameters));
        materials.push(new THREE.MeshLambertMaterial(parameters));
        materials.push(new THREE.MeshBasicMaterial( { transparent: true, opacity: 0.8, map: texture1 } ));
        materials.push(new THREE.MeshLambertMaterial(parameters));
        materials.push(new THREE.MeshBasicMaterial( { transparent: true, opacity: 0.8, map: texture2 } ));
        materials.push(new THREE.MeshLambertMaterial(parameters));
        materials.push(new THREE.MeshLambertMaterial(parameters));
        return materials;
    }

}
module.exports = {CodeBlock: CodeBlock, RealObject: RealObject, CodeLink:CodeLink};