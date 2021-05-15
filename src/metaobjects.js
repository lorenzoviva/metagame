var GLTFLoader = require("three-gltf-loader");
require("./custommesh.js");
var classes = require("./codeobjects.js");
let geval = this.execScript || eval;


class Object3D{
    name = "";
    common_name = "";
    identifier = "";
    animations = {};
    actions = {};
    controls = [];
    parent = null;
    object = null;
    relations = [];
    childrens = {};
    mesh = null;

    constructor(object = null, parent= scene, identifier="", mesh = null, name = "", common_name = "", animations = {}, actions = {}, controls = []) {
        this.setName(name);
        this.common_name = common_name;
        this.animations = animations;
        this.actions = actions;
        this.actions["Move"] = this.opt_userMove;
        this.actions["Show in console"] = this.opt_showInConsole;
        this.actions["Meta object"] = this.opt_getMetaObject;
        this.actions["Meta class"] = this.opt_getMetaClass;
        this.actions["Edit text"] = this.opt_editText;
        this.actions["Store as variable"] = this.opt_storeAsVar;
        this.controls = controls;
        this.parent = parent;
        this.identifier = identifier;
        this.metaobject = null;
        this.metaclass = null;
        this.relations = [];
        this.childrens = {};
        this.setMesh(mesh);
        this.setObject(object);
    }

    getCenterPoint(){
        var scale = this.mesh.scale;
        var gridPosition = this.getPositionGrid();
        var internalPosition = this.getPositionInternal();
        var center = new THREE.Vector3(gridPosition.x  + internalPosition.x,//+ scale.x / 2
            gridPosition.y  + internalPosition.y,//+ scale.y / 2
            gridPosition.z + internalPosition.z);// + scale.z / 2
        return center;
    }
    destroyer(){
        //console.log("Destroy: ", this)
        if(this.parent === scene){
            this.parent.remove(this.mesh);
        }else{
            this.parent.mesh.remove(this.mesh);
            delete this.parent.childrens[this.identifier];
        }
        delete deployer.objects[this.name];
        // delete window[this.name];
        delete this;
    }
    setName(name){
        if (typeof name === 'string' && name.length > 0){
            this.name = name + "_" + THREE.MathUtils.generateUUID().replaceAll("-","_");
            deployer.objects[this.name] = this;
        }
    }
    show(){
        if(this.mesh){
            this.mesh.visible = true;
        }
    }
    hide(){
        if(this.mesh){
            this.mesh.visible = false;
        }
    }
    setMesh(mesh){
        if(this.mesh) this.meshDestroy();
        this.mesh = mesh;
        if(this.mesh) this.meshSetup();
    }
    meshDestroy(){
        scene.remove(this.mesh);
    }
    meshSetup(){
        this.mesh.userData.object3D = this;
        this.put(this.parent);
    }
    getDepth(d=0){
        if(this.parent === scene){
            return d;
        }else{
            return this.parent.getDepth(d+1)
        }
    }
    getPosition(){
        return this.mesh.position;
    }
    getPositionGrid(){
        if(!this.mesh.hasOwnProperty("positionGrid")){
            this.mesh.positionGrid = new THREE.Vector3(0,0,0);
        }
        return this.mesh.positionGrid;
    }

    getPositionInternal(){
        if(!this.mesh.hasOwnProperty("positionInternal")){
            this.mesh.positionInternal = new THREE.Vector3(0,0,0);
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
        if(this.object) this.objectDestroy();
        this.object = object;
        if(this.object) this.objectSetup();
    }

    objectDestroy(){
        let children_names = Object.getOwnPropertyNames(this.childrens);
        for (var i = 0; i < children_names.length; i++){
            this.childrens[children_names[i]].destroyer()
        }
    }
    objectSetup(){
        let depth = this.getDepth();
        // console.log("DEPTH: " + depth + " for  " + this.object );

        if(depth < 1) {
            var sub_objects = Object.getOwnPropertyNames(this.object);
            // var sub_scale = this.mesh.geometry.parameters.width / (2 * sub_objects.length)
            var sub_scale = this.mesh.scale.x / (2 * sub_objects.length)
            for (var child_i = 0; child_i < sub_objects.length; child_i++) {
                var sub_object = this.object[sub_objects[child_i]];
                // console.log("Spawning object child CLASS: ", this.constructor.name, " OBJECT: " + this.object + " MESH: ", this.mesh, " SUBS: " + child_i + "/"+sub_objects.length + " ("+sub_objects[child_i] + " = " + sub_object + ")")
                let sub_object_position = new THREE.Vector3(-(this.mesh.scale.x / 2) + sub_scale * child_i * 2 + (sub_scale*0.5),-(sub_scale*0.5),-(sub_scale*0.5));
                var sub_object3D =  deployer.importObject(sub_object, sub_object_position, new THREE.Vector3(sub_scale, sub_scale, sub_scale), this, sub_objects[child_i]);//
                this.childrens[sub_objects[child_i]] = sub_object3D;
            }
        }
        if(this.parent !== scene){
            this.parent.object[this.identifier] = this.object;
        }
    }

    put(scene){
        if(scene === window.scene){
            scene.add( this.mesh );
        }else{
            scene.mesh.add(this.mesh)
        }
    }

    opt_editText(){
        return this.editText;
    }
    editText(){
        interfaces.showTextEditor(this);
    }
    editableText(){
        if(this.object === null){
            return "null";
        }
        var serializable = this.object;
        if(serializable.serialize === undefined){
            serializable = new classes.ObjectWrapper(this.object);
        }
        return JSON.stringify(serializable.serialize(), null, 2);
    }
    editFromText(text){
        if(this.object === null){
            this.setObject(geval(text))
        } else {
            var deserializable = text;
            try {
                deserializable = JSON.parse(text);
            } catch (e) {}
            var deserialized = null;
            if (deserializable.type && deployer.classes[deserializable.type] && deployer.classes[deserializable.type].deserialize) {
                deserialized = deployer.classes[deserializable.type].deserialize(text);
            } else {
                deserialized = deployer.classes.ObjectWrapper.deserialize(deserializable)
            }
            this.setObject(deserialized)

        }
    }
    opt_userMove(){
        return this.userMove;
    }
    userMove(){
        deployer.grid.object.active = true;
        deployer.grid.object.placing = this;
    }
    opt_showInConsole(){
        return this.showInConsole;
    }
    showInConsole(){
        console.log(this);
    }
    opt_storeAsVar(){
        return this.storeAsVar;
    }
    storeAsVar(){
        var n = 1;
        try {
            while (geval("temp" + n) !== undefined) {
                n++;
            }
        }catch (e) {}
        geval("var temp" + n + " = deployer.objects."+this.name);
        console.log("temp" + n, geval("temp" + n))
    }
    opt_getMetaObject(){
        if(this.metaobject === null) return this.getMetaObject;
        return null;
    }
    getMetaObject() {
        let positionGrid = this.getPositionGrid();
        positionGrid = new THREE.Vector3(positionGrid.x, positionGrid.y + 2, positionGrid.z);
        this.metaobject = deployer.importObject(this, positionGrid, new THREE.Vector3(1,1,1), scene, "metaobject")
    }
    opt_getMetaClass(){
        if(this.metaclass === null) return this.getMetaClass;
        return null;
    }
    getMetaClass() {
        let positionGrid = this.getPositionGrid();
        positionGrid = new THREE.Vector3(positionGrid.x - 2, positionGrid.y, positionGrid.z);
        this.metaclass = deployer.importObject(this.constructor, positionGrid, new THREE.Vector3(1,1,1), scene, "metaclass")
    }

    async loadGLTFMesh(url){
        var loader = new GLTFLoader();
        const gltf = await loader.loadAsync(url);
        this.mesh = gltf.scene;
    }
    static getTextTexture(text, color='rgb(255, 102, 0)', background= "rgb(39, 66, 21)", flip=false, flipV=false) {
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        // console.log(console);

        context.font = "25pt Source arial, sans-serif";
        context.textAlign = "center";
        context.fillStyle = background;
        let w = 600;
        let h = 600;
        var x = canvas.width / 2;
        var y = canvas.height / 2;

        context.fillRect(0, 0, w, h);

        context.fillStyle = color;
        context.fillText(text, x, y);
        let texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        if(flip){
            texture.wrapS = THREE.RepeatWrapping;
            texture.repeat.x = - 1;
        }
        if(flipV){
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.y = - 1;
        }
        return texture;;
    }

}
// class Scene3D extends Object3D{
//     constructor() {
//         super();
//     }
// }
// class String3D extends Object3D{
class Relation3D extends Object3D{
    constructor(link) {
        //console.log("Creating relation, link:", link);
        let lineCurve = null;
        let v0 = link.from.getCenterPoint();
        let v1 = link.to.getCenterPoint();
        if(link.shape === "arc"){
            let height = link.height;
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
        super( link, scene, link.identifier, mesh,  link.from.name+"-"+link.to.name,link.from.common_name+"-"+link.to.common_name,{},{},[]);
    }
    updatePosition(){
        //console.log("Updating relation, link:", this.object);

        let lineCurve = null;
        let v0 = this.object.from.getCenterPoint();
        let v1 = this.object.to.getCenterPoint();
        if(this.object.shape === "arc"){
            let height = this.object.height;
            // let height = v0.distanceTo(v1);
            let p0 = new THREE.Vector3(v0.x,v0.y + height, v0.z);
            let p1 = new THREE.Vector3(v1.x,v1.y + height, v1.z);
            lineCurve = new THREE.CubicBezierCurve3(v0, p0, p1, v1);
        }else{
            lineCurve = new THREE.LineCurve(v0, v1);
        }
        let tubeGeometry = new THREE.TubeGeometry(lineCurve, 20, 0.01, 8, false );
        let material = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.8, emissive: this.object.color, color:  this.object.color});
        let mesh = new THREE.Mesh(tubeGeometry, material);
        this.setMesh(mesh)
    }
}
class Code3D extends Object3D{
    constructor(code, parent=scene, identifier=""){
        super();
        this.parent = parent;
        this.setObject(code);

        this.setName(this.object.type);
        this.common_name = this.object.type;
        this.animations = {};
        // this.actions["Show dependencies"] = this.opt_showDependencies;
        this.actions["Fire"]  =this.opt_execute;
        this.actions["Show required modules"] = this.opt_showDependencies;
        this.actions["Show more instruction"]  = this.opt_showChild;
        this.actions["Show parameters"]  = this.opt_showParams;
        this.actions["Move instructions"]  = this.opt_moveChild;
        this.actions["Move parameters"]  = this.opt_moveParams;
        this.actions["Move required modules"]  = this.opt_moveDependencies;
        this.actions["Edit code"] = this.opt_editText;
        delete this.actions["Edit text"]
        this.controls = [];
        // var mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),  this.constructor.getTextMaterial(this.object.node))
        var mesh = new THREE.OpenCubeMesh(this.constructor.getTextMaterial(this.object))
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
        delete deployer.programs[this.name]
        super.destroyer();
    }
    setName(name){
        super.setName(name)
        if (typeof this.name === 'string' && this.name.length > 0){
            deployer.programs[this.name] = this;
        }
    }

    objectSetup() {
        // super.objectSetup();
        if(typeof this.object !== "object" || !(this.object instanceof classes.Code) ){
            this.object = classes.Code.createCode(this.object)
        }
        var dependencyURLList = this.object.dependencies
        this.dependencies = {};
        for (var dependency_i = 0; dependency_i < dependencyURLList.length; dependency_i++) {
            var dependency = dependencyURLList[dependency_i]
            this.dependencies[dependency] = null;
        }
        this.object.object3D = this;


    }

    editableText(){
        return this.object.node.code;
    }

    // editFromText(newCode){
    //     let code = this.object;
    //     let root = code.getRoot();
    //     var rootObject = root.object3D;
    //     var overwritten = root.node.code.substr(0,code.node.start) + newCode + root.node.code.substr(code.node.end, root.node.code.length - code.node.end);
    //     rootObject.setObject(overwritten);
    //     let editedCodeObject = classes.Code.createCode(newCode, null, code.parent);
    //     editedCodeObject = classes.Code.cutHeadNode(editedCodeObject);
    //     this.setObject(editedCodeObject);
    //     this.mesh.material = this.constructor.getTextMaterial(this.object);
    //     this.mesh.draw();
    // }
    editFromText(newCode){
        let code = this.object;
        console.log("EDITING CODE: ", this, ". Old code: ", code.node.code, "[" + code.constructor.name + "]", ".New code: ", newCode)
        let parent = code.parent;
        let editedCodeObject = classes.Code.createCode(newCode, null, parent);
        if(parent !== null){
            let parentObject = parent.object3D;
            var completeNewCode = parent.node.code.substr(0,code.node.start) + newCode + parent.node.code.substr(code.node.end, parent.node.code.length - code.node.end);
            console.log("\tCascading: ", parent, ". Old code: ", parent.node.code, "[" + parent.constructor.name + "]", ".New code: ", completeNewCode)
            parentObject.editFromText(completeNewCode);
            editedCodeObject = classes.Code.cutHeadNode(editedCodeObject);
        }
        this.setObject(editedCodeObject);
        this.mesh.material = this.constructor.getTextMaterial(this.object);
        this.mesh.draw();
    }

    opt_execute(){
        return this.execute;
    }
    execute(){
        var result = null;
        try {
            window.require = deployer.require3D;
            window.module = {};
            result = geval(this.object.node.code)
        } catch (e) {
            result = e;
        }
        let position = new THREE.Vector3(this.getPositionGrid().x,this.getPositionGrid().y,this.getPositionGrid().z);
        let scale = new THREE.Vector3(1,1,1);
        deployer.importObject(result, position, scale, scene, "deployer.objects['" + this.name + "'].execute()" );
    }


    opt_showDependencies(){
        let dependencyURLList = this.object.dependencies;
        if(dependencyURLList.length > 0){
            var hasDrawnAll = true;
            for (var dependency_i = 0; dependency_i < dependencyURLList.length; dependency_i++){
                if(this.dependencies[dependencyURLList[dependency_i]] === null){
                    hasDrawnAll = false;
                }
            }
            return !hasDrawnAll? this.showDependencies:null;
        }else {
            return null;
        }
    }
    showDependencies(){
        deployer.import3DJSDependencies(this);
    }
    opt_showChild(){
        if(this.object.fc_child.length > 0){
            var hasDrawnAll = true;
            for (var i = 0; i < this.object.fc_child.length; i++){
                if(this.object.fc_child[i].object3D === undefined){
                    hasDrawnAll = false;
                }
            }
            return !hasDrawnAll? this.showChild:null;
        }else {
            return null;
        }
    }
    showChild(){
        deployer.importCodeFromCode(this)
    }
    opt_showParams(){
        if(this.object.fc_params.length > 0){
            var hasDrawnAll = true;
            for (var i = 0; i < this.object.fc_params.length; i++){
                if(this.object.fc_params[i].object3D === undefined){
                    hasDrawnAll = false;
                }
            }
            return !hasDrawnAll? this.showParams:null;
        }else {
            return null;
        }
    }

    showParams(){
        deployer.importParametersFromCode(this)
    }
    opt_moveChild(){
        if(this.object.fc_child.length > 0){
            var hasDrawnAny = false;
            for (var i = 0; i < this.object.fc_child.length; i++){
                if(this.object.fc_child[i].object3D !== undefined){
                    hasDrawnAny = true;
                }
            }
            return hasDrawnAny? this.moveChild:null;
        }else {
            return null;
        }
    }
    moveChild(){
        var child = [];
        for (var i = 0; i < this.object.fc_child.length; i++){
            if(this.object.fc_child[i].object3D !== undefined){
                child.push(this.object.fc_child[i].object3D);
            }
        }
        deployer.grid.object.active = true;
        deployer.grid.object.placing = child;

    }
    opt_moveParams(){
        if(this.object.fc_params.length > 0){
            var hasDrawnAny = false;
            for (var i = 0; i < this.object.fc_params.length; i++){
                if(this.object.fc_params[i].object3D !== undefined){
                    hasDrawnAny = true;
                }
            }
            return hasDrawnAny? this.moveParams:null;
        }else {
            return null;
        }
    }
    moveParams(){
        var child = [];
        for (var i = 0; i < this.object.fc_params.length; i++){
            if(this.object.fc_params[i].object3D !== undefined){
                child.push(this.object.fc_params[i].object3D);
            }
        }
        deployer.grid.object.active = true;
        deployer.grid.object.placing = child;

    }
    opt_moveDependencies(){
        let dependencyURLList = this.object.dependencies;
        if(dependencyURLList.length > 0){
            var hasDrawnAny = false;
            for (var dependency_i = 0; dependency_i < dependencyURLList.length; dependency_i++){
                if(this.dependencies[dependencyURLList[dependency_i]] !== null){
                    hasDrawnAny = true;
                }
            }
            return hasDrawnAny? this.moveDependencies:null;
        }else {
            return null;
        }
    }
    moveDependencies(){
        let dependencyURLList = this.object.dependencies;
        var child = [];
        for (var dependency_i = 0; dependency_i < dependencyURLList.length; dependency_i++){
            if(this.dependencies[dependencyURLList[dependency_i]] !== null){
                child.push(this.dependencies[dependencyURLList[dependency_i]]);
            }
        }
        deployer.grid.object.active = true;
        deployer.grid.object.placing = child;
    }


    static getTextMaterial(code) {
        var node = code.node;
        var materials = [];
        // let parameters = { transparent: true, opacity: 0.8}
        let parameters = {side: THREE.DoubleSide}
        switch (node.type){
            case "VariableDeclaration":
                // parameters.emissive = 'rgb(125,54,0)';
                parameters.color = 'rgb(125,54,0)';
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.type, 'rgb(255,102,0)', "rgb(12,25,96)") } ));
                materials.push(null);
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.code, 'rgb(12,25,96)', "rgb(255, 102, 0)") } ));
                materials.push(null);
                materials.push(null);
                // materials.push(null);//identifier
                let variableIdentifiers = code.getVariableIdentifiers();
                // console.log("CODE PARAMS:" ,code,  variableIdentifiers)
                if(variableIdentifiers.length > 0){
                    materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(variableIdentifiers.join(", "), 'rgb(0,0,0)', "rgb(0,144,255)", true) } ));
                }else {
                    materials.push(new THREE.MeshBasicMaterial(parameters));
                    // materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(code.fc_params[0].node.code, 'rgb(12,25,96)', "rgb(255, 102, 0)", true) } ));
                }
                return materials;
            case "ExpressionStatement":
                // parameters.emissive = 'rgb(69,5,5)';
                parameters.color = 'rgb(69,5,5)';
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.type, 'rgb(255, 102, 0)', "rgb(69,5,5)") } ));
                materials.push(new THREE.MeshBasicMaterial(parameters));
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.code, 'rgb(12,25,96)', "rgb(255, 102, 0)") } ));
                materials.push(null);
                materials.push(null);
                materials.push(null);
                return materials;
            case "ClassDeclaration":
                var className = code.getDeclaredClassName()
                // parameters.emissive = 'rgb(69,5,5)';
                parameters.color = 'rgb(50,5,69)';
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.type, 'rgb(255, 102, 0)', "rgb(50,5,69)") } ));
                materials.push(new THREE.MeshBasicMaterial(parameters));
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.code, 'rgb(12,25,96)', "rgb(255, 102, 0)") } ));
                materials.push(new THREE.MeshBasicMaterial(parameters));
                materials.push(null);
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(className, 'rgb(0,0,0)', "rgb(0,144,255)", true) } ));
                return materials;
            case "FunctionDeclaration":
                var functionName = code.getDeclaredFunctionName()
                //console.log("FUNCTION DECLARATION:" ,code, functionName)
                // parameters.emissive = 'rgb(13,43,10)';
                parameters.color = 'rgb(13,43,10)';
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.type, 'rgb(255, 102, 0)', "rgb(13,43,10)") } ));
                materials.push(new THREE.MeshBasicMaterial(parameters));
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.code, 'rgb(12,25,96)', "rgb(255, 102, 0)") } ));
                materials.push(null);
                materials.push(null);
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(functionName, 'rgb(0,0,0)', "rgb(0,144,255)", true) } ));

                // materials.push(new THREE.MeshBasicMaterial(parameters));
                return materials;
            default:
                // parameters.emissive = 'rgb(0,61,45)';
                // parameters.color  = 'rgb(0,61,45)';
                parameters.color  = 'rgb(0,61,45)';
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.type, 'rgb(255, 102, 0)', "rgb(0,61,45)") } ));
                materials.push(new THREE.MeshBasicMaterial(parameters));
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.code, 'rgb(12,25,96)', "rgb(255, 102, 0)") } ));
                materials.push(new THREE.MeshBasicMaterial(parameters));
                materials.push(null);
                materials.push(new THREE.MeshBasicMaterial(parameters));
                return materials;

        }

    }


}
class Function3D extends Code3D{
    constructor(object, parent=scene, identifier=""){
        let code = object.toString();
        if (code.endsWith("{ [native code] }")){
            code = "this." + object.name;
        }
        code = classes.Code.createCode(code);
        code = classes.Code.cutHeadNode(code)
        super(code, parent, identifier);
    }
}
class Module3D extends Code3D{
    constructor(module, parent=scene, identifier=""){
        super(module, parent, identifier);
    }

    setObject(object) {
        if(object !== null && typeof object === "string" && this.object !== null){
            var reference = this.object.node.reference;
            object = new classes.Module(object, reference)
        }else if(object !== null && object instanceof classes.Code && this.object !== null){
            object.node.reference = this.object.node.reference;
        }
        super.setObject(object);

    }
    // editFromText(newCode) {
    //     var model = this.object;
    // }

    showChild(){
        deployer.importFromModule(this)
    }

    meshSetup() {
        super.meshSetup();
        // let depth = this.getDepth();
        // console.log("DEPTH: " + depth + " for  " + this.object );

        // if(depth < 1) {
        //     var sub_objects = this.object.child;
        //     // var sub_scale = this.mesh.geometry.parameters.width / (2 * sub_objects.length)
        //     var sub_scale = this.mesh.scale.x / (2 * sub_objects.length)
        //     for (var child_i = 0; child_i < sub_objects.length; child_i++) {
        //         var sub_object = this.object.child[child_i];
        //         let sub_object_position = new THREE.Vector3(-(this.mesh.scale.x / 2) + sub_scale * child_i * 2 + (sub_scale*0.5),-(sub_scale*0.5),-(sub_scale*0.5));
        //         console.log("Adding subchild for module: " + this.object.node.reference + " --> ", sub_object)
        //         // var sub_object3D =  new classes.Code3D(sub_object);//
        //         //,[sub_object_position, new THREE.Vector3(sub_scale, sub_scale, sub_scale), this]
        //         var sub_object3D =  deployer.importObject(sub_object,sub_object_position, new THREE.Vector3(sub_scale, sub_scale, sub_scale), this);//
        //     }
        // }
    }

    static getTextMaterial(module) {
        var node = module.node;
        var materials = [];
        let parameters = { transparent: true, opacity: 0.8, emissive: 'rgb(12,96,93)', color: "rgb(12,96,93)", side: THREE.DoubleSide};
        materials.push(new THREE.MeshBasicMaterial( { transparent: true, opacity: 0.8, side: THREE.DoubleSide, map: Object3D.getTextTexture("MODULE", 'rgb(12,96,93)', "rgb(255, 102, 0)") } ));
        materials.push(null);
        materials.push(null);
        materials.push(new THREE.MeshLambertMaterial(parameters));
        materials.push(new THREE.MeshBasicMaterial( { transparent: true, opacity: 0.8, side: THREE.DoubleSide, map: Object3D.getTextTexture(node.reference, 'rgb(255, 102, 0)', "rgb(39, 66, 21)") } ));
        materials.push(null);

        return materials;
    }
}
class Grid3D extends Object3D{
    constructor(object={size: 40,  orientation: "xz"}) {
        super();
        this.setName("Grid")
        this.common_name = "Grid"
        var gridPlane = new THREE.TileGridWireFrame(object.size, object.orientation);

        this.setMesh(gridPlane);
        this.setObject(object);
        gridPlane.updateMatrixWorld();
        this.actions = {} //prevent from moving the grid
    }
    moveObject(intersects, placing=this.object.placing){

        if(placing.constructor.name === Array.name){
            for (var i = 0; i < placing.length; i++){
                this.moveObject(intersects, placing[i]);
            }
            this.object.start = intersects.point;
            return;
        }
        if(this.object.start !== null){
            //console.log("object: ", placing)
            var actual_position =  placing.getPositionGrid();
            let xgrid = this.object.anti_normal.x ? Math.floor(intersects.point.x) - Math.floor(this.object.start.x) + actual_position.x: actual_position.x;
            let ygrid = this.object.anti_normal.y ? Math.floor(intersects.point.y) - Math.floor(this.object.start.y) + actual_position.y: actual_position.y;
            let zgrid = this.object.anti_normal.z ? Math.floor(intersects.point.z) - Math.floor(this.object.start.z) + actual_position.z: actual_position.z;
            placing.setPositionGrid(new THREE.Vector3(xgrid, ygrid, zgrid))
            if(placing.relations.length > 0){
                for(var relation_i = 0; relation_i < placing.relations.length; relation_i++){
                    placing.relations[relation_i].updatePosition();
                }
            }
        }
        if(placing === this.object.placing){
            this.object.start = intersects.point;
        }
    }
    objectSetup() {
        // super.objectSetup(); //lol, dont
        this.object.active = false;
        this.object.placing = null;
        this.object.start = null;
        if(this.object.orientation.includes("x") && this.object.orientation.includes("y")){
            this.object.anti_normal = new THREE.Vector3(1, 1,0);
        }else if(this.object.orientation.includes("y") && this.object.orientation.includes("z")){
            this.object.anti_normal = new THREE.Vector3(0, 1,1);
        }else{
            this.object.anti_normal = new THREE.Vector3(1, 0,1);

        }
    }
}
// class Grid3D extends Object3D{
//     constructor(object={width: 40, height: 40, orientation: "xz"}) {
//         super();
//         this.setName("Grid")
//         this.common_name = "Grid"
//         var gridPlane = new THREE.GridHelper(object.width,object.width);
//         this.setMesh(gridPlane);
//         this.setObject(object);
//         gridPlane.updateMatrixWorld();
//     }
//     objectSetup() {
//         // super.objectSetup(); //lol, dont
//     }
// }

classes.Code3D = Code3D;
classes.Function3D = Function3D;
classes.Module3D = Module3D;
classes.Object3D = Object3D;
classes.Relation3D =Relation3D;
classes.Grid3D = Grid3D;

require("./customserialization.js");


module.exports = classes;