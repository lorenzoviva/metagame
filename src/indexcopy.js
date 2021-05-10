var THREE = require('three');
var GLTFLoader = require("three-gltf-loader");
const OrbitControls = require('three-orbit-controls')(THREE);
// var acorn = require("acorn")
const {Parser} = require('acorn');
const cloneDeep = require('lodash/fp/cloneDeep');
const classFields = require('acorn-class-fields');
// const tf = require('@tensorflow/tfjs');
let camera, scene, renderer, camControls, clock;

window.THREE = THREE;
window.objects = [];

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
        delete this;
    }
    setName(name){
        if (typeof name === 'string' && name.length > 0){
            this.name = name + "_" + THREE.MathUtils.generateUUID();
        }
    }

    setMesh(mesh){
        this.mesh = mesh;
        if(this.mesh) this.meshSetup();
    }

    meshSetup(){
        this.mesh.userData.realObject = this;
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
        super(link.from.name+"-"+link.to.name,link.from.common_name+"-"+link.to.common_name,{},{},[], link, new THREE.Mesh(
            new THREE.TubeGeometry(
                new THREE.LineCurve(link.from.mesh.position, link.to.mesh.position), 20, 0.01, 8, false ),
            new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.8, emissive: link.color, color: link.color})));
    }
}
class CodeBlock extends RealObject{
    constructor(code){
        super();
        this.setObject(code);

        this.setName(this.object.ast.type);
        this.common_name = this.object.ast.type;
        this.animations = {};
        this.actions = {'Hide flowchart':this.opt_clearFC, 'Show flowchart':this.opt_FCTo3D, 'Hide AST':this.opt_clearAST, 'Show AST':this.opt_ASTTo3D, "Edit code": this.opt_editText};
        this.controls = [];
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2),  CodeBlock.getTextMaterial(this.object.ast.node))
        this.setMesh(mesh);

        this.links = [];
        this.ast_child = [];
        this.fc_child = [];
        this.fc_param = [];
    }

    objectSetup() {
        super.objectSetup();
        if(typeof this.object === "string"){
            var root = Parser.extend(classFields).parse(this.object);
            console.log("parsed: ", root);
            var ast = CodeBlock.jsToAST(root, this.object);
            console.log("AST: ", ast);
            var fc = CodeBlock.ASTToFlowChart(cloneDeep(ast));
            console.log("FC: ", fc);
            this.object = {code:this.object, ast: ast, fc: fc, visualize: 'flowchart'}
        }

    }

    opt_ASTTo3D(){
        if(this.fc_param.length === 0 && this.fc_child.length === 0 && this.ast_child.length === 0){
            return this.ASTTo3D;
        }else{
            return null;
        }
    }
    ASTTo3D(initial_position= new THREE.Vector3(0,0.1,0)){

        this.mesh.position.x = initial_position.x;
        this.mesh.position.y = initial_position.y;
        this.mesh.position.z = initial_position.z;
        this.put(scene);
        this.object.ast.position = initial_position;
        let right_most_x = initial_position.x;
        let last_child_position = new THREE.Vector3(right_most_x , initial_position.y, initial_position.z-0.4);
        for(var child_i = 0; child_i < this.object.ast.child.length; child_i++){
            last_child_position = new THREE.Vector3(right_most_x + (child_i > 0?0.4:0), last_child_position.y, last_child_position.z);
            var child_object = new CodeBlock({code:this.object.ast.child[child_i].node.code, ast: this.object.ast.child[child_i], fc: this.object.ast.child[child_i], visualize: 'ast'});//{code: this.object.ast.code, ast: this.object.ast.child[child_i]}
            let bounds = child_object.ASTTo3D(last_child_position);
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
            // scene.remove(this.ast_child[child_i].mesh);
        }
        this.ast_child = [];
        for(var link_i = 0; link_i < this.links.length; link_i++){
            this.links[link_i].destroyer();
            // scene.remove(this.links[link_i].mesh);
        }
        this.links = [];
    }
    opt_FCTo3D(){
        if(this.fc_param.length === 0 && this.fc_child.length === 0 && this.ast_child.length === 0 && this.object.fc !== undefined){
            return this.FCTo3D;
        }else{
            return null;
        }
    }
    FCTo3D(initial_position= new THREE.Vector3(0,0.1,0)){

        this.mesh.position.x = initial_position.x;
        this.mesh.position.y = initial_position.y;
        this.mesh.position.z = initial_position.z;
        this.put(scene);
        this.object.fc.position = initial_position;
        let right_most_x = initial_position.x;
        let last_child_position = new THREE.Vector3(right_most_x , initial_position.y, initial_position.z);
        // if(this.object.fc.node.code.split(/\r\n|\r|\n/).length > 2)//!this.object.ast.type.endsWith("Expression") && && !this.object.ast.type.endsWith("Statement")
        for(var param_i = 0; param_i < this.object.fc.params.length; param_i++){
            last_child_position = new THREE.Vector3(right_most_x, last_child_position.y, last_child_position.z - 0.4);
            var param_object = new CodeBlock({code:this.object.fc.params[param_i].node.code, ast: this.object.fc.params[param_i], fc: this.object.fc.params[param_i], visualize: 'flowchart'});
            param_object.FCTo3D(last_child_position);
            this.fc_param.push(param_object);
            var link1 = new CodeLink({from: this, to: param_object, color: 'rgb(12,96,27)'});
            link1.put(scene);
            this.links.push(link1);
        }
        last_child_position = new THREE.Vector3(right_most_x , initial_position.y, initial_position.z-0.4);
        for(var child_i = 0; child_i < this.object.fc.child.length; child_i++){
            last_child_position = new THREE.Vector3(right_most_x + 0.4, last_child_position.y, last_child_position.z);
            var child_object = new CodeBlock({code:this.object.fc.child[child_i].node.code, ast: this.object.fc.child[child_i], fc: this.object.fc.child[child_i], visualize: 'flowchart'});
            let bounds = child_object.FCTo3D(last_child_position);
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
    }

    opt_editText(){
        return this.editText;
    }
    editText(){
        showTextEditor(this);
    }
    editCode(newCode, bounds = {left: 0, right: this.object.code.lenght}){
        var overwritten = this.object.code.substr(0, bounds.left) +
            newCode +
            this.object.code.substr(bounds.right, this.object.code.lenght-bounds.right);
        // if(this.object.ast.parent !== null){
        //     this.
        // }
        this.setObject(overwritten);
        var redoAST = this.opt_clearAST();
        var redoFC = this.opt_clearFC();
        if(redoAST !== null){
            redoAST();
            this.ASTTo3D();
        }else if (redoFC !== null){
            redoFC();
            this.FCTo3D();
        }
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
        var fc = ast;
        fc.params = [];
        var childs = [];
        for(var child_i = 0; child_i < ast.child.length; child_i++){
            let child_type = ast.child[child_i].node.type;
            if(child_type === "Identifier" || child_type === "Literal" || child_type === "ThisExpression"){
                fc.params.push(CodeBlock.ASTToFlowChart(ast.child[child_i]));
            }else{
                childs.push(CodeBlock.ASTToFlowChart(ast.child[child_i]));
            }
        }
        fc.child = childs;
        var skip_to = fc;
        var params = []
        while(skip_to.child.length === 1){// && skip_to.child[0].child.length > 0
            skip_to = skip_to.child[0];
            params.push(...skip_to.params)
        }
        if(skip_to !== fc){// && fc.params.length === 0
            // console.log("SKIPPED from " , fc , " to: ", skip_to)
            fc.params.push(...params);
            if(skip_to.child.length !== 1) {
                fc.child = skip_to.child;
            }else{
                fc.params.push(...skip_to.child[0].params);
                fc.child = [];
            }
            // return CodeBlock.ASTToFlowChart(fc)
        }
        return fc;
    }
    static jsToAST(node, code, parent=null){
        node.code = code.substr(node.start, node.end-node.start)
        var result = {node: node, child: [], type: node.type, parent: parent, getRoot: function () {if(this.parent !== null){return this.getRoot(this.parent);} else{return this;}}}
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
const raycaster = new THREE.Raycaster()
const mouse = {polar: new THREE.Vector2(), cartesian: new THREE.Vector2(), event:"none"};
var last_clicked_object = null;
var last_frame_time = new Date();
var maxFPS = 60;
var game_loop_timeout = null;

function onMouseMove( event ) {
    mouse.cartesian.x = event.clientX;
    mouse.cartesian.y = event.clientY;
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.polar.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.polar.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    mouse.event = 'move';
    let menu = document.getElementById("menu");
    // console.log("CONDITION:" + menu.style.display + " ", mouse.cartesian.x , menu.style.left.replace('px',''), mouse.cartesian.x > menu.style.left.replace('px','') + menu.offsetWidth,  mouse.cartesian.y, menu.style.top.replace('px',''))
    let left = Number(menu.style.left.replace('px',''));
    let top = Number(menu.style.top.replace('px',''));
    if (menu.style.display === 'unset' &&
        (mouse.cartesian.x < left - 10 || mouse.cartesian.x > left + menu.offsetWidth + 10 ||
        mouse.cartesian.y < top - 10|| mouse.cartesian.y > top + menu.offsetHeight + 10)){
        closeMenu();

    }

}
function onClick( event ) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.polar.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.polar.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    mouse.cartesian.x = event.clientX;
    mouse.cartesian.y = event.clientY;
    if(event.button === 0){
        mouse.event = 'downright';

    }else{
        mouse.event = 'downleft';

    }

}
function showMenu(title, options){
    let menu = document.getElementById("menu");
    menu.innerHTML = '';

    menu.appendChild(document.createTextNode(title));

    menu.style.display = "unset";
    menu.style.left = mouse.cartesian.x + "px";
    menu.style.top = mouse.cartesian.y + "px";

    let optionList = Object.getOwnPropertyNames(options);
    for (var i = 0; i < optionList.length; i++){
        var option = document.createElement("div");
        option.className="option"
        option.id="option"+i
        let callback = options[optionList[i]].apply(last_clicked_object);
        if (callback !== null){
            let callback_function = function (){ callback.apply(last_clicked_object); closeMenu();};
            // console.log("Callback: " , callback, ' object: ' , last_clicked_object)
            option.onclick= callback_function;
            var node = document.createTextNode(optionList[i]);
            option.appendChild(node);
            menu.appendChild(option)
        }
    }
    var cancel = document.createElement("div");
    cancel.className="option"
    cancel.id="option"+i
    let cancel_function = function (){ closeMenu();};
    cancel.onclick= cancel_function;
    var cancel_node = document.createTextNode('Cancel');
    cancel.appendChild(cancel_node);
    menu.appendChild(cancel)
}
function closeMenu(){
    let menu = document.getElementById("menu");
    menu.style.display = "none";
}
function showTextEditor(realObject){
    let editorPanel = document.getElementById("editorpanel");
    editorPanel.innerHTML = '';
    editorPanel.style.display = "flex";
    var titlePanel = document.createElement("div");
    titlePanel.className = "title"
    titlePanel.appendChild(document.createTextNode("Edit: " + realObject.name + " object"));
    var buttonPanel = document.createElement("div");
    buttonPanel.className = "interface topright buttonpanel"
    buttonPanel.appendChild(createButton("bluebutton", "\uD83D\uDCBE", function() {
        let newCode = document.getElementById("texteditor").value;
        // console.log("Save code:", newCode);
        realObject.editCode(newCode);
    }));
    buttonPanel.appendChild(createButton("redbutton", "\u2718",function() {closeTextEditor()}));
    titlePanel.appendChild(buttonPanel)
    editorPanel.appendChild(titlePanel)
    var textarea = document.createElement("textarea");
    textarea.id = "texteditor";
    textarea.appendChild(document.createTextNode(realObject.object.code));
    editorPanel.appendChild(textarea)
}
function createButton(class_string, text, onclick){
    var button = document.createElement("div");
    button.className = "interfacebutton " + class_string
    button.onclick = onclick;
    button.appendChild(document.createTextNode(text));
    return button;
}
function closeTextEditor(){
    let editorPanel = document.getElementById("editorpanel");
    editorPanel.style.display = "none";
}

window.addEventListener( 'mousemove', onMouseMove, false );
window.addEventListener( 'mousedown', onClick, false );

init();



function init() {

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.0001, 100 );
    camera.position.z = 5;
    camera.position.y = 0.5;
    // camera.position.x = 0.5;

    scene = new THREE.Scene();
    clock = new THREE.Clock();
    //
    // var sceneadd = scene.__proto__.add;
    //
    // scene.__proto__.add  = function(mesh){
    //     console.log("CALLBACK ON SCENE ADD")
    //     sceneadd.apply(this, [mesh]);
    // }

    // // console.log("Parsed: ", acorn.parse("console.log('hello world!')"));
    // let geo, mat, mesh;
    //
    // let cube_obj = new RealObject("cube1", "cube", {},{},[],null, mesh,null,null)
    //
    // // scene.add( mesh );
    // cube_obj.put(scene);

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );


    // renderer.setAnimationLoop( animation );
    document.body.appendChild( renderer.domElement );
    // console.log("added", cube_obj, scene, camera)

    const geometry = new THREE.PlaneGeometry( 1000, 1000, 10,10 );
    const wireframematerial = new THREE.MeshBasicMaterial( {color: 0x0A0A0A, side: THREE.DoubleSide, wireframe:true} );
    const material = new THREE.MeshBasicMaterial( {color: 0xF9F9F9, side: THREE.DoubleSide} );
    const planeframe = new THREE.Mesh( geometry, wireframematerial );
    const plane = new THREE.Mesh( geometry, material );
    planeframe.rotation.x = Math.PI / 2;
    plane.rotation.x = Math.PI / 2;
    scene.add( planeframe );
    scene.add( plane );

    // const light = new THREE.AmbientLight( 0xFFFFFF ); // soft white light
    // scene.add( light );


    const spotLight = new THREE.SpotLight( 0xffffff );
    spotLight.position.set( 0, 5, 0 );

    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 500;
    spotLight.shadow.camera.far = 4000;
    spotLight.shadow.camera.fov = 30;

    scene.add( spotLight );

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render ); // use if there is no animation loop

    controls.minDistance = 0.1;
    controls.maxDistance = 10;
    controls.target.set( 0, 0, - 0.2 );
    controls.update();

    // const camControls = new PointerLockControls( camera, document.body );

    // camControls = new FirstPersonControls(camera);
    // camControls.lookSpeed = 0.4;
    // camControls.movementSpeed = 5;
    // camControls.noFly = true;
    // camControls.lookVertical = true;
    // camControls.constrainVertical = true;
    // camControls.verticalMin = 1.0;
    // camControls.verticalMax = 2.0;
    // camControls.lon = -150;
    // camControls.lat = 120;
    // camControls.addEventListener( 'change', render );
    // render();

    var loader = new GLTFLoader();
    window.loader = loader;
    loader.load(
        "/models/homeswitch.glb",
        function ( gltf ) {
            console.log("Loaded ", gltf, THREE)
            let group = gltf.scene;
            window.group = group;
            group.scale.x = 0.1
            group.scale.y = 0.1
            group.scale.z = 0.1
            group.rotation.z = Math.PI / 2;
            scene.add( group )
            renderer.render(scene, camera);
        },
    );

    httpGet('/src/kernel.js', function (code) {
        console.log("Code read: " , code.split(/\r\n|\r|\n/).length)

        var tree = new CodeBlock(code);
        tree.put(scene);
        // tree.FCTo3D();
        // tree.staticAnalisys();

    });
    window.tf = tf;


    window.scene = scene;
    window.requestAnimationFrame(render);


}


function moveSubTree(ast, translate) {
    var instruction = ast.object;
    instruction.mesh.position.x += translate.x;
    instruction.mesh.position.y += translate.y;
    instruction.mesh.position.z += translate.z;
    for (var child_i = 0; child_i < ast.child.length; child_i++) {
        moveSubTree(ast.child[child_i], translate)
    }
}

function render() {

    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse.polar, camera );

    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects( scene.children );
    let firstRealObject = null;
    for ( let i = 0; i < intersects.length; i ++ ) {

        // intersects[ i ].object.material.color.set( 0xff0000 );
        let intersectedObject = intersects[intersects.length - i -1 ].object.userData;
        if (intersectedObject.realObject !== undefined) {
            firstRealObject = intersectedObject.realObject;
        }
        // console.log("INTERCEPTING: ",i , intersectedObject)

    }
    let menu = document.getElementById("menu");
    let editorpanel = document.getElementById("editorpanel");
    if ( firstRealObject !== null){
        document.getElementById("topleft").innerText = firstRealObject.common_name;
        if(menu.style.display !== 'unset' && editorpanel.style.display !== 'flex'){
            last_clicked_object = firstRealObject;
            if(mouse.event === 'downleft'){
                var options = firstRealObject.actions;
                showMenu(firstRealObject.common_name, options)
            }
        }
    }
    var new_time = new Date()
    let fps = 1000 / (new_time.getTime() - last_frame_time.getTime());
    if(fps > maxFPS){
        var minDelay = 1000 / maxFPS;
        var delayRender = Math.ceil(minDelay - (new_time.getTime() - last_frame_time.getTime()));
        if(game_loop_timeout === null) game_loop_timeout = setTimeout(renderSync, delayRender);
    }else{
        renderSync();
    }
}
function renderSync(){
    var new_time = new Date()
    let fps = 1000 / (new_time.getTime() - last_frame_time.getTime());
    document.getElementById("topright").innerText = Math.ceil(fps) + " FPS";
    last_frame_time = new_time;
    renderer.render( scene, camera );
    game_loop_timeout = null;
    requestAnimationFrame(render);
}

function httpGet(theUrl, callback)
{
    if (window.XMLHttpRequest)
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        var xmlhttp = new XMLHttpRequest();
    }
    else
    {// code for IE6, IE5
        var xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            let responseText = xmlhttp.responseText;
            // console.log(responseText)
            callback(responseText);
        }
    }
    xmlhttp.open("GET", theUrl, false );
    xmlhttp.send(); // NS_ERROR_FAILURE is here
}