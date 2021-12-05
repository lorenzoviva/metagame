require('../core/setupcontextvariables.js');

function onWindowResize(){
    window.cameraManager.onWindowResize();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
window.addEventListener( 'resize', onWindowResize, false );
