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
        this.actions["Space>Move"] = this.opt_userMove;
        this.actions["Code>Console>Show in console"] = this.opt_showInConsole;
        this.actions["Show>Meta object"] = this.opt_getMetaObject;
        this.actions["Show>Meta class"] = this.opt_getMetaClass;
        this.actions["Edit text"] = this.opt_editText;
        this.actions["Code>Console>Store as variable"] = this.opt_storeAsVar;
        this.actions["Space>Delete"] = this.opt_destroy;
        this.controls = controls;
        this.parent = parent;
        this.identifier = identifier;
        this.metaobject = null;
        this.metaclass = null;
        this.relations = {};
        this.childrens = {};
        this.setMesh(mesh);
        this.setObject(object);
    }
    redraw(object, parent, identifier){
        var g_pos = this.getPositionGrid();
        var i_pos = this.getPositionInternal();
        this.parent = parent;
        this.identifier = identifier;
        if(object?.getGenericMesh !== undefined){
            let mesh = object.getGenericMesh(parent, identifier);
            this.setMesh(mesh);
            this.setObject(object);
            this.setPositionGrid(g_pos);
            this.setPositionInternal(i_pos);
        }else{
            var objectType = deployer.getObject3DType(object);
            let color = new classes.Color().randomLight();
            let side_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.classes.Object3D.getTextTexture((object === undefined || object === null ?'undefined':identifier),"rgb(0,0,0)", color, true) });
            let darker_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.classes.Object3D.getTextTexture((object === undefined || object === null ?'undefined':(object.serialize === undefined?JSON.stringify(new classes.ObjectWrapper(object).serialize()):JSON.stringify(object.serialize()))),"rgb(0,0,0)" , color.darker(0.1), false, true) });
            let text_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.classes.Object3D.getTextTexture(objectType ,"rgb(0,0,0)" , color.lighter(0.2), true) } );
            let mesh = new THREE.OpenCubeMesh([null, text_material, null, darker_material, null, side_material]);
            this.setMesh(mesh);
            this.setObject(object);
            this.setPositionGrid(g_pos);
            this.setPositionInternal(i_pos);

        }
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
    opt_destroy(){
        return this.destroyer;
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
        let relation_names = Object.getOwnPropertyNames(this.relations);
        for (var r = 0; r < relation_names.length; r++){
            this.relations[relation_names[r]].destroyer();
        }
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
        if(this.parent && this.parent !== scene){
            this.parent.mesh.remove(this.mesh);
        }else{
            scene.remove(this.mesh);
        }
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
        this.setupWatcher();
        if(depth < 1) {
            const excludes = ["watch", "unwatch"]
            var sub_objects = Object.getOwnPropertyNames(this.object);
            for(var exclude of excludes){
                if(sub_objects.includes(exclude)){
                    sub_objects.splice(sub_objects.indexOf(exclude),1)
                }
            }
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
            try {
                this.parent.object[this.identifier] = this.object;
            }catch (e){
                //not really important, other reference are defined. This only occurs on objects
            }
        }
    }
    setupWatcher(){
        if(this.object === null || this.object === undefined || !this.object instanceof Object ||  this.object.constructor.toString().indexOf('[native code]') > -1 ) return;
        console.log("s setupWatcher: " , this.object)
        if (!this.object.watch) {
            console.log("!this.object.watch: " , this.object.watch)

            const that = this;
            this.object.watch = function (prop, handler) {
                var oldval = this[prop],
                    newval = oldval,
                    getter = function () {
                        return newval;
                    },
                    setter = function (val) {
                        oldval = newval;
                        newval = val;
                        handler.call(that, this, prop, oldval, val);
                    };
                if (delete this[prop]) { // can't watch constants
                    if (this.defineProperty) // ECMAScript 5
                        this.defineProperty(this, prop, {
                            get: getter,
                            set: setter
                        });
                    else if (this.__defineGetter__ && this.__defineSetter__) { // legacy
                        this.__defineGetter__.call(this, prop, getter);
                        this.__defineSetter__.call(this, prop, setter);
                    }
                }
            };
            console.log("s watching: " , this.object)

            for(var prop of Object.getOwnPropertyNames(this.object)){
                console.log("watching: " , prop)
                if(prop !== "watch" && prop !== "unwatch")
                this.object.watch(prop, that.onObjectExternalEdit)
            }
        }
        // object.unwatch
        if (!this.object.unwatch){
            this.object.unwatch = function (prop) {
                var val = this[prop];
                delete this[prop]; // remove accessors
                this[prop] = val;
            };
        }
    }
    onObjectExternalEdit(new_object, property, old_value, new_value){
        console.log("external edit: ",this, new_object, property,old_value, new_value)
        for(var prop of Object.getOwnPropertyNames(new_object)){
            console.log("Prop: ", prop, " value: ", new_object[prop])
        }
        if(new_value !== old_value)
        this.redraw(new_object, this.parent, this.identifier);
        return new_value;
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
            this.redraw(geval(text), this.parent, this.identifier)
            // this.setObject(geval(text))
        } else {
            var deserializable = text;
            try {
                deserializable = JSON.parse(text);
            } catch (e) {}
            var deserialized = deployer.classes.ObjectWrapper.deserialize(deserializable);
            this.redraw(deserialized, this.parent, this.identifier)

            // this.setObject(deserialized)

        }
    }
    opt_userMove(){
        return this.userMove;
    }
    userMove(){
        deployer.grid.object.active = true;
        deployer.grid.object.placing = this;
    }
    move(grid, intersect){
        //console.log("moving: ", this)
        var actual_position =  this.getPositionGrid();
        let xgrid = grid.anti_normal.x ? Math.floor(intersect.point.x) - Math.floor(grid.start.x) + actual_position.x: actual_position.x;
        let ygrid = grid.anti_normal.y ? Math.floor(intersect.point.y) - Math.floor(grid.start.y) + actual_position.y: actual_position.y;
        let zgrid = grid.anti_normal.z ? Math.floor(intersect.point.z) - Math.floor(grid.start.z) + actual_position.z: actual_position.z;
        this.setPositionGrid(new THREE.Vector3(xgrid, ygrid, zgrid))
        let relation_names = Object.getOwnPropertyNames(this.relations);
        if(relation_names.length > 0){
            for(var relation_i = 0; relation_i < relation_names.length; relation_i++){
                this.relations[relation_names[relation_i]].updatePosition();
            }
        }
        this.onMove();
    }
    onMove(){
        if(this.parent !== null && this.parent !== scene && this.parent.getPositionGrid() !== this.getPositionGrid()){
            this.parent.onChildrenMoveOut(this.identifier);
            this.redraw(this.object, scene, this.identifier);
            console.log("Redraw: ", this, this.parent.constructor.name, Object3D.constructor.name)
            var scale = this.mesh.scale;
            var position = this.getPositionInternal();
            this.setPositionInternal(new THREE.Vector3(scale.x/2,scale.y/2,scale.z/2))
            this.setPositionGrid(new THREE.Vector3(Math.floor(position.x),Math.floor(position.y),Math.floor(position.z)))
        }
    }
    onChildrenMoveOut(identifier){
        if(this.object.constructor === Object){
            delete this.object[identifier]
            this.redraw(this.object, this.parent, this.identifier);
        }
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
        canvas.setAttribute("width",600)
        canvas.setAttribute("height",600)

        let w = 600;
        let h = 600;
        var x = canvas.width / 2;
        var y = canvas.height / 2;
        context.fillStyle = background;

        context.fillRect(0, 0, w, h);

        context.fillStyle = color;
        // context.fillText(text, x, y);
        Object3D.wrapText(context, text,x,y,w,h, 70 )
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
        return texture;
    }
    static getTextHeight(context, text, x, y, maxWidth, lineHeight){
        var lines = text.split("\n");
        y = 0;
        for(var n = 0; n < lines.length; n++) {
            var metrics = context.measureText(lines[n]);
            var testWidth = metrics.width;
            if (testWidth > maxWidth) {
                var longLine = lines[n];
                while (longLine !== ""){
                    var c = 0;
                    var testline = ''+longLine.substr(c, 1);
                    var line = '';
                    metrics = context.measureText(testline+"-")
                    while (c < longLine.length && metrics.width < maxWidth){
                        c++;
                        line = testline;
                        testline = testline+longLine.substr(c, 1);
                        metrics = context.measureText(testline +"-")
                    }
                    longLine = longLine.substr(line.length,longLine.length - line.length )
                    y += lineHeight;
                }
            } else {
                y += lineHeight;
            }
        }
        return y;
    }
    static wrapText(context, text, x, y, maxWidth, maxHeight, fontSize=25) {
        if(text.length > 800){
            return Object3D.wrapText(context, text.substr(0,797) + "...", x, y, maxWidth, maxHeight, fontSize);
        }
        context.font = fontSize+ "px Source arial, sans-serif";
        context.textAlign = "center";
        var lineHeight = Math.ceil(fontSize*1.25);
        var height = Object3D.getTextHeight(context, text, x, y, maxWidth, lineHeight);
        while (height > maxHeight){
            fontSize = Math.floor(fontSize * (maxHeight/height));
            // console.log("reduce; " , fontSize, " height : ", height)
            context.font = fontSize+ "px Source arial, sans-serif";
            lineHeight = Math.ceil(fontSize*1.25);
            height = Object3D.getTextHeight(context, text, x, y, maxWidth, lineHeight);
        }
        if(fontSize === 0) {
            fontSize = 1;
            lineHeight = 2;
            height = Object3D.getTextHeight(context, text, x, y, maxWidth, lineHeight);

        }
        // console.log("Height: ", height, " line: ", lineHeight, " text: "  , text, " Y: ", y, " fontSize: ", fontSize, " maxHeight", maxHeight)
        y = y - (height - lineHeight)/2;
        var lines = text.split("\n");

        for(var n = 0; n < lines.length; n++) {
            var metrics = context.measureText(lines[n]);
            var testWidth = metrics.width;
            if (testWidth > maxWidth) {
                var longLine = lines[n];
                while (longLine !== ""){
                    let c = 0;
                    let testline = ''+longLine.substr(c, 1);
                    var line = '';
                    metrics = context.measureText(testline+"-")
                    while (c < longLine.length && metrics.width < maxWidth){
                        c++;
                        line = testline;
                        testline = testline+longLine.substr(c, 1);
                        metrics = context.measureText(testline +"-")
                    }
                    if(line.endsWith(" ") || testline.endsWith(" ") || line === longLine){
                        if(line === longLine){
                            let c = 0;
                            metrics = context.measureText(line)
                            while (metrics.width < maxWidth){
                                line += " ";
                                metrics = context.measureText(line)
                            }
                            line = line.substr(0, line.length - 1)
                        }
                        context.fillText(line, x, y);
                    }else{
                        context.fillText(line+"-", x, y);
                    }
                    longLine = longLine.substr(line.length,longLine.length - line.length)
                    y += lineHeight;
                }
            } else {
                let testline = lines[n] + " "
                if(lines.length > 1){
                    let c = 0;
                    metrics = context.measureText(testline)
                    while (metrics.width < maxWidth){
                        testline += " ";
                        metrics = context.measureText(testline)
                    }
                }
                context.fillText(testline.substr(0, testline.length - 1), x, y);
                y += lineHeight;
            }
        }
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
    destroyer() {
        delete deployer.relations[this.name];
        delete this.object.from.relations[this.name];
        delete this.object.to.relations[this.name];
        super.destroyer();
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
    objectSetup(){

    }
}
class Code3D extends Object3D{
    constructor(code, parent=scene, identifier=""){
        super();
        this.parent = parent;
        this.setObject(code);
        this.identifier = identifier;
        this.setName(this.object.type);
        this.common_name = this.object.type;
        this.animations = {};
        // this.actions["Show dependencies"] = this.opt_showDependencies;
        this.actions["Code>Fire"]  =this.opt_execute;
        this.actions["Code>Show required modules"] = this.opt_showDependencies;
        this.actions["Code>Show more instruction"]  = this.opt_showChild;
        this.actions["Code>Show parameters"]  = this.opt_showParams;
        this.actions["Code>Move instructions"]  = this.opt_moveChild;
        this.actions["Code>Move parameters"]  = this.opt_moveParams;
        this.actions["Code>Move required modules"]  = this.opt_moveDependencies;
        this.actions["Edit code"] = this.opt_editText;
        delete this.actions["Edit text"]
        this.controls = [];
        // var mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),  this.constructor.getTextMaterial(this.object.node))
        var mesh = new THREE.OpenCubeMesh(this.constructor.getTextMaterial(this))
        this.setMesh(mesh);
        this.setPositionInternal(new THREE.Vector3(0.5,0.5,0.5))

        this.links = [];
        this.sa_links = [];
        this.dependency_links = [];
        this.ast_child = [];
        this.fc_child = [];
        this.fc_param = [];
    }
    onMove() {

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
        if(this.object.fc_child.length > 0){
            for (var i = 0; i < this.object.fc_child.length; i++){
                if(this.object.fc_child[i].object3D !== undefined){
                    this.object.fc_child[i].object3D.destroyer();
                }
            }
        }
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
        // this.setupWatcher();

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

    editFromText(newCode){
        let code = this.object;
        console.log("EDITING CODE: ", this, ". Old code: ", code.node.code, "[" + code.constructor.name + "]", ".New code: ", newCode)
        let parent = code.getFirstObject3DParent();
        let editedCodeObject = classes.Code.createCode(newCode, null, parent);
        if(parent !== null){
            let parentObject = parent.object3D;
            var completeNewCode = parent.node.code.substr(0,code.node.start - parent.node.start) + newCode + parent.node.code.substr(code.node.end  - parent.node.start, parent.node.code.length - code.node.end + parent.node.start);
            console.log("\tCascading: ", parent, ". Old code: ", parent.node.code, "[" + parent.constructor.name + "]", ".New code: ", completeNewCode)
            parentObject.editFromText(completeNewCode);
            editedCodeObject = classes.Code.cutHeadNode(editedCodeObject);
            // if(editedCodeObject.child.length > 1){
            return this.destroyer();
            // }
        }

        this.redraw(editedCodeObject)
    }
    redraw(object, parent, identifier) {
        this.setObject(object);
        this.mesh.material = this.constructor.getTextMaterial(this);
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


    static getTextMaterial(code3d) {
        var code = code3d.object;
        var node = code.node;
        var materials = [];
        // let parameters = { transparent: true, opacity: 0.8}
        let parameters = {side: THREE.DoubleSide}
        switch (node.type){
            case "VariableDeclaration":
                // parameters.emissive = 'rgb(125,54,0)';
                parameters.color = classes.VariableDeclaration.primaryColor;
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.type, classes.Code.backgroundColor, classes.Code.foregroundColor) } ));
                materials.push(null);
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.code, classes.Code.foregroundColor, classes.Code.backgroundColor) } ));
                materials.push(null);
                materials.push(null);
                // materials.push(null);//identifier
                let variableIdentifiers = code.getVariableIdentifiers();
                // console.log("CODE PARAMS:" ,code,  variableIdentifiers)
                if(variableIdentifiers.length > 0){
                    materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(variableIdentifiers.join(", "), classes.Identifier.secondaryColor, classes.Identifier.primaryColor, true) } ));
                }else {
                    materials.push(new THREE.MeshBasicMaterial(parameters));
                    // materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(code.fc_params[0].node.code, classes.Code.foregroundColor, classes.Code.backgroundColor, true) } ));
                }
                return materials;
            case "ExpressionStatement":
                // parameters.emissive = 'rgb(69,5,5)';
                parameters.color = classes.ExpressionStatement.primaryColor;
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.type, classes.Code.backgroundColor,  classes.ExpressionStatement.primaryColor) } ));
                materials.push(new THREE.MeshBasicMaterial(parameters));
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.code, classes.Code.foregroundColor, classes.Code.backgroundColor) } ));
                materials.push(null);
                materials.push(null);
                materials.push(null);
                return materials;
            case "ClassDeclaration":
                var className = code.getDeclaredClassName()
                // parameters.emissive = 'rgb(69,5,5)';
                parameters.color = classes.ClassDeclaration.primaryColor;
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.type, classes.Code.backgroundColor, classes.ClassDeclaration.primaryColor) } ));
                materials.push(new THREE.MeshBasicMaterial(parameters));
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.code, classes.Code.foregroundColor, classes.Code.backgroundColor) } ));
                materials.push(new THREE.MeshBasicMaterial(parameters));
                materials.push(null);
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(className, classes.Identifier.secondaryColor, classes.Identifier.primaryColor, true) } ));
                return materials;
            case "FunctionDeclaration":
                var functionName = code.getDeclaredFunctionName();
                if (functionName === ""){
                    functionName = code3d.identifier;
                }
                //console.log("FUNCTION DECLARATION:" ,code, functionName)
                // parameters.emissive = 'rgb(13,43,10)';
                parameters.color = classes.FunctionDeclaration.primaryColor;
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.type, classes.Code.backgroundColor, classes.FunctionDeclaration.primaryColor) } ));
                materials.push(new THREE.MeshBasicMaterial(parameters));
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.code, classes.Code.foregroundColor, classes.Code.backgroundColor) } ));
                materials.push(null);
                materials.push(null);
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(functionName, classes.Identifier.secondaryColor, classes.Identifier.primaryColor, true) } ));

                // materials.push(new THREE.MeshBasicMaterial(parameters));
                return materials;
            default:
                // parameters.emissive = 'rgb(0,61,45)';
                // parameters.color  = 'rgb(0,61,45)';
                parameters.color  = classes.Code.defaultColor;
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.type, classes.Code.backgroundColor, classes.Code.defaultColor) } ));
                materials.push(new THREE.MeshBasicMaterial(parameters));
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.code, classes.Code.foregroundColor, classes.Code.backgroundColor) } ));
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
        this.actions["Set filename"] = this.opt_setReference;
        this.actions["Save"] = this.opt_save;
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


    opt_setReference(){
        return this.setReference;
    }
    setReference(){
        var name = prompt("insert name");
        if(name === null || name === "") return;
        name = name.trim();
        if (!name.endsWith(".js")) name = name + ".js";
        this.object.node.reference = name;
        this.redraw(this.object, this.parent, this.identifier)
    }
    opt_save() {
        if (this?.object?.node?.reference !== undefined){
            return this.save;
        }
        return null;
    }
    save(){
        clientserver.httpPost("/src/"+this.object.node.reference,this.object.node.code,function() {});
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

    static getTextMaterial(module3d) {
        var module = module3d.object;
        var node = module.node;
        var materials = [];
        let parameters = { transparent: true, opacity: 0.8, emissive: 'rgb(12,96,93)', color: "rgb(12,96,93)", side: THREE.DoubleSide};
        materials.push(new THREE.MeshBasicMaterial( { transparent: true, opacity: 0.8, side: THREE.DoubleSide, map: Object3D.getTextTexture("MODULE", 'rgb(12,96,93)', classes.Code.backgroundColor) } ));
        materials.push(null);
        materials.push(null);
        materials.push(new THREE.MeshLambertMaterial(parameters));
        materials.push(new THREE.MeshBasicMaterial( { transparent: true, opacity: 0.8, side: THREE.DoubleSide, map: Object3D.getTextTexture(node.reference, classes.Code.backgroundColor, "rgb(39, 66, 21)") } ));
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
    onMouseMove(raycaster){
        if(this.object.active){
            const intersects = raycaster.intersectObjects( [this.mesh.plane] );
            for ( let i = 0; i < intersects.length; i ++ ) {
                this.moveObject(intersects[i])
            }
        }
    }
    onLeftClick(){
        if (this.object.active){
            this.object.placing = null;
            this.object.active = false;
            this.object.start = null;
        }
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
            placing.move(this.object, intersects);
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
class Null3D extends Object3D{

    constructor(object=null, parent = null, identifier = "null") {
        var color = new classes.Color(160,20,20);
        var textColor = new classes.Color(255,255,255);
        let side_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.classes.Object3D.getTextTexture(identifier,textColor, color, true) });
        let darker_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.classes.Object3D.getTextTexture("null",textColor , color.darker(0.1), false, true) });
        let text_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.classes.Object3D.getTextTexture(Null3D.name ,textColor , color.lighter(0.2), true) } );
        var mesh = new THREE.OpenCubeMesh([null, text_material, null, darker_material, null, side_material]);
        super(object, parent, identifier, mesh);
    }
}
class Undefined3D extends Object3D{

    constructor(object=undefined, parent = undefined, identifier = "undefined") {
        var color = new classes.Color(200,100,100);
        var textColor = new classes.Color(255,255,255);
        let side_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.classes.Object3D.getTextTexture(identifier,textColor, color, true) });
        let darker_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.classes.Object3D.getTextTexture("undefined",textColor , color.darker(0.1), false, true) });
        let text_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.classes.Object3D.getTextTexture(Undefined3D.name ,textColor , color.lighter(0.2), true) } );
        var mesh = new THREE.OpenCubeMesh([null, text_material, null, darker_material, null, side_material]);
        super(object, parent, identifier, mesh);
    }
}
classes.Null3D = Null3D;
classes.Undefined3D = Undefined3D;

classes.Code3D = Code3D;
classes.Function3D = Function3D;
classes.Module3D = Module3D;
classes.Object3D = Object3D;
classes.Relation3D =Relation3D;
classes.Grid3D = Grid3D;

require("./customserialization.js");


module.exports = classes;