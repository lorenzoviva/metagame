
class MouseControls {

    constructor() {
        this.listeners = {};
        this.mouse = {
            polar: new THREE.Vector2(),
            cartesian: new THREE.Vector2(),
            event:"none",
            down: false,
            up: false,
            left: false,
            right: false,
            wheel: 0
        };
        this.raycaster = new THREE.Raycaster()
    }
    getInterceptingObjectList(){
        return deployer?.getInterceptingObjectList(this.raycaster);
    }

    onMouseEvent(event){
        // console.log("Mouse event:",this, event, event.button);
        this.mouse.cartesian.x = event.clientX;
        this.mouse.cartesian.y = event.clientY;
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        this.mouse.polar.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        this.mouse.polar.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        this.raycaster.setFromCamera( this.mouse.polar, window.cameraManager.camera );

        this.mouse.event = event.type;
        this.mouse.down = event.type === "mousedown";
        this.mouse.up = event.type === "mouseup";
        this.mouse.left = event.type === "mousedown" && event.button === 0;
        this.mouse.right = event.type === "mousedown" && event.button === 2;
        var handlers = this.listeners[event.type];
        var i = 0;
        for(var handler of handlers){
            i++;
            if(handler.mesh !== null){
                if(handler.compete){
                    let interceptingObjectList = this.getInterceptingObjectList();
                    if((interceptingObjectList.length > 0 && interceptingObjectList[0].mesh === handler.mesh)){
                        handler.callback(event, this.mouse, this.raycaster, interceptingObjectList);
                    }
                }else{
                    var intersects = this.raycaster.intersectObject(handler.mesh, true);
                    if(intersects.length > 0){
                        handler.callback(event, this.mouse, this.raycaster);
                    }
                }
            }else{
                handler.callback(event, this.mouse, this.raycaster);
            }
            // if(handler.mesh !== null){
            //     if(handler.compete)
            //     var intersects = this.raycaster.intersectObject(handler.mesh, true);
            //     if(intersects.length > 0){
            //         if (!handler.compete || (this.getInterceptingObjectList().length > 0 && this.getInterceptingObjectList()[0].mesh === handler.mesh)) handler.callback(event, this.mouse, this.raycaster);
            //     }
            // }else{
            //     handler.callback(event, this.mouse, this.raycaster);
            // }
        }
        return false;
    }
    register(event, handler, mesh=null, compete=false){
        if(this.listeners[event] === undefined){
            this.listeners[event] = [];
            window.addEventListener(event, this.onMouseEvent.bind(this));
        }
        let id = THREE.MathUtils.generateUUID().replaceAll("-","_");
        this.listeners[event].push({callback: handler, mesh: mesh, compete: compete, id: id});
        return id;
    }
    unregister(event, id){
        if(this.listeners[event] === undefined){
            return;
        }
        // console.log("Unregistering", event, this.listeners[event].length);
        var index = this.listeners[event].indexOf(this.listeners[event].find(function(element){
            return element.id === id;
        }));
        if(index !== -1){
            this.listeners[event].splice(index, 1);
        }
        // console.log("Unregistered", event, index, this.listeners[event].length);
        if(this.listeners[event].length === 0){
            window.removeEventListener(event, this.onMouseEvent);
        }
    }
    onRender(){
        if(window.scene === undefined) return;
        // update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera( this.mouse.polar, window.cameraManager.camera );
        var handlers = this.listeners.render;
        for(var handler of handlers){
            handler.callback(this.getInterceptingObjectList(), this.mouse, this.raycaster);
        }
    }
}
module.exports = MouseControls;