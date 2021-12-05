// class Boolean3D extends deployer.classes.Object3D{
//     constructor(object, parent, identifier){
//         let color = null;
//         if(object){
//             color = new deployer.classes.Color(0,255,0);
//         }else{
//             color = new deployer.classes.Color(255,0,0);
//         }
//         let darker_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.classes.Object3D.getTextTexture(object + "", "rgb(0,0,0)" , color.darker(0.1), false, true) });
//         let text_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.classes.Object3D.getTextTexture("Boolean3D","rgb(0,0,0)" , color.lighter(0.2), true) } );
//         var mesh = new THREE.OpenCubeMesh([null, text_material, null, darker_material, null, null])
//         super(object, parent, identifier, mesh, "Boolean3D", "Boolean3D", {},{},[]);
//     }
// }
class Boolean3D extends deployer.classes.Object3D{
    constructor(object, parent, identifier){
        super(object, parent, identifier, null, "Boolean3D", "Boolean3D", {},{},[]);
    }
     draw(){
         if(this.object){
             this.color = new deployer.classes.Color(0,255,0);
         }else{
             this.color = new deployer.classes.Color(255,0,0);
         }
        return super.draw();
    }
}
deployer.classes.Boolean3D = Boolean3D;