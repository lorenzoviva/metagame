var THREE = require('three');
const OrbitControls = require('three-orbit-controls')(THREE);
window.THREE = THREE;
const interfaces = require('./interfaces.js')
window.clientserver = require('./clientserver.js');
const GlobalDeployer = require('./scriptdeployer.js')
require("./clientutils.js")
window.deployer = new GlobalDeployer();
window.geval = this.execScript || eval;
window.interfaces = interfaces;
window.metaobjects = deployer.classes;
let camera, scene, renderer, camControls, clock;

THREE.Vector3.prototype.getRotated = function(v){
    var res = new THREE.Vector3(this.x, this.y, this.z);
    res.applyAxisAngle(new THREE.Vector3( 1, 0, 0 ), v.x);
    res.applyAxisAngle(new THREE.Vector3( 0, 1, 0 ), v.y);
    res.applyAxisAngle(new THREE.Vector3( 0, 0, 1 ), v.z);
    return res;
}



const raycaster = new THREE.Raycaster()
const mouse = {polar: new THREE.Vector2(), cartesian: new THREE.Vector2(), event:"none"};
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
    interfaces.interfaceMouseMove(mouse);


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
    return false;
}

window.addEventListener( 'mousemove', onMouseMove, false );
window.addEventListener( 'mousedown', onClick, false );
window.addEventListener( 'resize', onWindowResize, false );

init();

function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

window.swapCamera = function swapCamera(){
    let cameraswitcher = document.getElementById("cameraswitcher");
    let swap = cameraswitcher.innerText;
    let new_camera = window.camera;
    if(swap === "Orthogonal"){
        interfaces.setInterfaceText("cameraswitcher", "Perspective")
        new_camera = new THREE.OrthographicCamera( - 10 * window.innerWidth / window.innerHeight, 10*window.innerWidth / window.innerHeight, 10, -10 );

    }else{
        interfaces.setInterfaceText("cameraswitcher", "Orthogonal")
        new_camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.0001, 100 );
    }
    new_camera.position.copy(window.camera.position);
    new_camera.rotation.copy(window.camera.rotation);
    window.camera = new_camera;
    window.controls.object = window.camera;
    window.requestAnimationFrame(render);

}

function init() {

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.0001, 100 );
    // camera = new THREE.OrthographicCamera( - 10 * window.innerWidth / window.innerHeight, 10*window.innerWidth / window.innerHeight, 10, -10 );
    camera.position.z = 5;
    camera.position.y = 5;
    scene = new THREE.Scene();

    clock = new THREE.Clock();

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );


    // renderer.setAnimationLoop( animation );
    document.body.appendChild( renderer.domElement );
    // console.log("added", cube_obj, scene, camera)

    // const geometry = new THREE.PlaneGeometry( 1001, 1001, 1001,1001 );
    // const wireframematerial = new THREE.MeshBasicMaterial( {color: 0x0A0A0A, side: THREE.DoubleSide, wireframe:true} );
    // const material = new THREE.MeshBasicMaterial( {color: 0xF9F9F9, side: THREE.DoubleSide} );
    // const planeframe = new THREE.Mesh( geometry, wireframematerial );
    // const plane = new THREE.Mesh( geometry, material );
    // planeframe.rotation.x = Math.PI / 2;
    // plane.rotation.x = Math.PI / 2;
    // scene.add( planeframe );
    // scene.add( plane );
    // var gridPlane = new THREE.TileGridWireFrame(40,40,"xz");
    // scene.add( gridPlane );

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

    window.scene = scene;
    window.camera = camera;
    window.controls = controls;
    window.renderer = renderer;

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

    // var loader = new GLTFLoader();
    // window.loader = loader;
    // loader.load(
    //     "/models/homeswitch.glb",
    //     function ( gltf ) {
    //         console.log("Loaded ", gltf, THREE)
    //         let group = gltf.scene;
    //         window.group = group;
    //         group.scale.x = 0.1
    //         group.scale.y = 0.1
    //         group.scale.z = 0.1
    //         group.rotation.z = Math.PI / 2;
    //         scene.add( group )
    //         renderer.render(scene, camera);
    //     },
    // );

    deployer.importGrid();
    // deployer.import3DJSModule('/src/kernel.js')
    deployer.import3DJSModule('/src/playground.js')
    // import3DJSModule('/src/clientserver.js',new THREE.Vector3(-4,0,0))
    // import3DJSModule('/src/metaobjects.js',new THREE.Vector3(-8,0,0))
    // deployer.import3DJSModule('/src/playground.js')
    // window.tf = tf;

    window.requestAnimationFrame(render);


}




function render() {
    if(scene === undefined) return;
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse.polar, window.camera );

    // calculate objects intersecting the picking ray
    // console.log("render:  ", mouse.polar)
    var all_meshes = [];
    var new_meshes = scene.children.filter(function (element) {
        return  deployer.grid === undefined || element !== deployer.grid.mesh;
    });
    while (new_meshes.length > 0){
        var childs = [];
        all_meshes.push(...new_meshes);
        for (var mesh_index = 0; mesh_index < new_meshes.length; mesh_index++){
            if(new_meshes[mesh_index] !== undefined && new_meshes[mesh_index].children !== undefined){
                childs.push(...new_meshes[mesh_index].children);
            }
        }
        new_meshes = childs;
    }
    // console.log("CHECKING INTERCEPT ON: ", all_meshes)
    if(deployer.grid && deployer.grid.object.active){
        const intersects2 = raycaster.intersectObjects( [deployer.grid.mesh.plane] );
        for ( let i = 0; i < intersects2.length; i ++ ) {
            deployer.grid.moveObject(intersects2[i])
            if(mouse.event === 'downleft') {
                deployer.grid.object.placing = null;
                deployer.grid.object.active = false;
                deployer.grid.object.start = null;
            }
        }
    }
    const intersects = raycaster.intersectObjects( all_meshes );
    let object3DList = [];
    for ( let i = 0; i < intersects.length; i ++ ) {
        // intersects[ i ].object.material.color.set( 0xff0000 );
        let intersectedObject = intersects[i].object;
        if (intersectedObject.userData.object3D !== undefined) {
            let items = intersectedObject.userData.object3D;
            if (!object3DList.includes(items)){
                object3DList.push(items);
            }
        }else if(intersectedObject.parent !== scene && intersectedObject.parent.userData.object3D !== undefined){
            let items = intersectedObject.parent.userData.object3D;
            if (!object3DList.includes(items)){
                object3DList.push(items);
            }
        }
        // console.log("INTERCEPTING: ",i , intersectedObject)

    }
    deployer.hideAllRelations();

    if ( object3DList.length > 0){
        var nameList = "";
        for (var i = 0; i < object3DList.length; i++){
            nameList += object3DList[i].common_name + " > "
        }
        nameList = nameList.substr(0, (nameList.length - " > ".length));
        // if(nameList.length > 40){
        //     nameList= nameList.substr(0, 40) + "...";
        // }
        interfaces.setInterfaceText("contextviewer",nameList)

        deployer.showRelations(object3DList[0]);
        if(interfaces.allInterfacesClosed() && (deployer.grid === undefined || deployer.grid.object.active === false)){
            if(mouse.event === 'downleft'){
                var options = object3DList[0].actions;
                interfaces.showMenu(mouse, object3DList[0], options)
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
    interfaces.setInterfaceText("fpscounter", Math.ceil(fps) + " FPS")
    last_frame_time = new_time;
    renderer.render( scene, window.camera );
    game_loop_timeout = null;
    requestAnimationFrame(render);
}

