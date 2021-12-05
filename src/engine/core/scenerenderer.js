const THREE = require("three");
const OrbitControls = require('three-orbit-controls')(THREE);
window.THREE = THREE;

const MouseControls = require('../controls.js');
window.mouseControls = new MouseControls();
window.interfaces = require('../interfaces/interfaces.js')
window.clientserver = require('../networking/clientserver.js');
const GlobalDeployer = require('../core/deployers/scriptdeployer.js')
const CameraManager = require('./cameramanager.js');
require("../tools/clientutils.js")




class SceneRenderer{
    constructor(maxFPS=60){
        window.deployer = new GlobalDeployer();
        window.geval = this.execScript || eval;
        window.metaobjects = deployer.classes;
        window.maxFPS = maxFPS;
        window.last_frame_time = new Date();
        window.game_loop_timeout = null;
        this.init();
    }


    init() {
        let cameraManager, scene, renderer, clock;

        cameraManager = new CameraManager();
        scene = new THREE.Scene();

        clock = new THREE.Clock();

        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setSize( window.innerWidth, window.innerHeight );

        document.body.appendChild( renderer.domElement );

        const spotLight = new THREE.SpotLight( 0xffffff );
        spotLight.position.set( 0, 5, 0 );

        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;
        spotLight.shadow.camera.near = 500;
        spotLight.shadow.camera.far = 4000;
        spotLight.shadow.camera.fov = 30;

        scene.add( spotLight );

        const controls = new OrbitControls( cameraManager.camera, renderer.domElement );
        controls.addEventListener( 'change', this.render ); // use if there is no animation loop

        controls.minDistance = 0.1;
        controls.maxDistance = 10;
        controls.target.set( 0, 0, - 0.2 );

        window.scene = scene;
        window.cameraManager = cameraManager;
        window.controls = controls;
        window.renderer = renderer;

        window.render = this.render;
        window.renderSync = this.renderSync;

        controls.update();

        deployer.importGrid();
        deployer.import3DJSModule('/src/playground.js');
        deployer.import3DJSModule('/src/playgroundclass.js',new THREE.Vector3(-2,0,0));

        window.requestAnimationFrame(this.render);

    }

    render() {
        mouseControls.onRender();
        var new_time = new Date()
        let fps = 1000 / (new_time.getTime() - window.last_frame_time.getTime());
        if(fps > window.maxFPS){
            var minDelay = 1000 / window.maxFPS;
            var delayRender = Math.ceil(minDelay - (new_time.getTime() - window.last_frame_time.getTime()));
            if(window.game_loop_timeout === null) window.game_loop_timeout = setTimeout(window.renderSync, delayRender);
        }else{
            window.renderSync();
        }
    }
    renderSync(){
        var new_time = new Date()
        let fps = 1000 / (new_time.getTime() - window.last_frame_time.getTime());
        interfaces.setInterfaceText("fpscounter", Math.ceil(fps) + " FPS")
        window.last_frame_time = new_time;
        renderer.render( scene, window.cameraManager.camera );
        window.game_loop_timeout = null;
        requestAnimationFrame(window.render);
    }
}
module.exports = SceneRenderer;