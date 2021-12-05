var THREE = require('three');
const OrbitControls = require('three-orbit-controls')(THREE);

const interfaces = require('./interfaces.js')
const clientserver = require('./clientserver.js')
const metaobjects = require('./metaobjects.js')

let camera, scene, renderer, camControls, clock;

THREE.Vector3.prototype.getRotated = function(v){
    var res = new THREE.Vector3(this.x, this.y, this.z);
    res.applyAxisAngle(new THREE.Vector3( 1, 0, 0 ), v.x);
    res.applyAxisAngle(new THREE.Vector3( 0, 1, 0 ), v.y);
    res.applyAxisAngle(new THREE.Vector3( 0, 0, 1 ), v.z);
    return res;
}

window.interfaces = interfaces;
window.metaobjects = metaobjects;
window.THREE = THREE;
window.objects = [];

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

}

window.addEventListener( 'mousemove', onMouseMove, false );
window.addEventListener( 'mousedown', onClick, false );

init();




function init() {

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.0001, 100 );
    // camera = new THREE.OrthographicCamera( - 10 * window.innerWidth / window.innerHeight, 10*window.innerWidth / window.innerHeight, 10, -10 );
    camera.position.z = 5;
    camera.position.y = 5;
    scene = new THREE.Scene();
    window.scene = scene;
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
    THREE.PlaneBufferGeometry.prototype.toGrid = function() {
            let segmentsX = this.parameters.widthSegments || 1;
            let segmentsY = this.parameters.heightSegments || 1;
            let indices = [];
            for (let i = 0; i < segmentsY + 1; i++) {
                let index11 = 0;
                let index12 = 0;
                for (let j = 0; j < segmentsX; j++) {
                    index11 = (segmentsX + 1) * i + j;
                    index12 = index11 + 1;
                    let index21 = index11;
                    let index22 = index11 + (segmentsX + 1);
                    indices.push(index11, index12);
                    if (index22 < ((segmentsX + 1) * (segmentsY + 1) - 1)) {
                        indices.push(index21, index22);
                    }
                }
                if ((index12 + segmentsX + 1) <= ((segmentsX + 1) * (segmentsY + 1) - 1)) {
                    indices.push(index12, index12 + segmentsX + 1);
                }
            }
            this.setIndex(indices);
            return this;
        }
    //
    var planeGeom = new THREE.PlaneBufferGeometry(40, 40, 40,40).toGrid();
    var gridPlane = new THREE.LineSegments(planeGeom, new THREE.LineBasicMaterial({color: "yellow"}))
    gridPlane.rotation.x = Math.PI / 2;
    scene.add( gridPlane );

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

    import3DJS('/src/kernel.js')
    import3DJS('/src/clientserver.js',new THREE.Vector3(-4,0,0))
    import3DJS('/src/metaobjects.js',new THREE.Vector3(-8,0,0))
    import3DJS('/src/playground.js',new THREE.Vector3(-4,0,-5))
    window.tf = tf;
    window.scene = scene;
    window.requestAnimationFrame(render);


}
function import3DJS(url, position= new THREE.Vector3(0,0,0)){
    clientserver.httpGet(url, function (code) {
        console.log("Code read: " , code.split(/\r\n|\r|\n/).length)

        var codeblock = new metaobjects.CodeBlock(code);
        codeblock.reference = url.substr(5);
        codeblock.setPositionGrid(position);
        codeblock.put(scene);

    });
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

    if ( firstRealObject !== null){
        interfaces.setInterfaceText("topleft", firstRealObject.common_name)
        if(interfaces.allInterfacesClosed()){
            if(mouse.event === 'downleft'){
                var options = firstRealObject.actions;
                interfaces.showMenu(mouse, firstRealObject, options)
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
    interfaces.setInterfaceText("topright", Math.ceil(fps) + " FPS")
    last_frame_time = new_time;
    renderer.render( scene, camera );
    game_loop_timeout = null;
    requestAnimationFrame(render);
}

