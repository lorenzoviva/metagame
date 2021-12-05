const THREE = require("three");


class CameraManager {

    constructor() {
        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.0001, 100 );
        // camera = new THREE.OrthographicCamera( - 10 * window.innerWidth / window.innerHeight, 10*window.innerWidth / window.innerHeight, 10, -10 );
        this.camera.position.z = 5;
        this.camera.position.y = 5;
    }
    onWindowResize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }
    swapCamera(){
            let cameraswitcher = document.getElementById("cameraswitcher");
            let swap = cameraswitcher.innerText;
            let new_camera = this.camera;
            if(swap === "Orthogonal"){
                interfaces.setInterfaceText("cameraswitcher", "Perspective")
                new_camera = new THREE.OrthographicCamera( - 10 * window.innerWidth / window.innerHeight, 10*window.innerWidth / window.innerHeight, 10, -10 );

            }else{
                interfaces.setInterfaceText("cameraswitcher", "Orthogonal")
                new_camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.0001, 100 );
            }
            new_camera.position.copy( this.camera.position);
            new_camera.rotation.copy( this.camera.rotation);
            this.camera = new_camera;
            window.controls.object = this.camera;
            window.requestAnimationFrame(render);

        }
}
module.exports = CameraManager;