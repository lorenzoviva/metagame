

class OpenCubeMesh extends THREE.Mesh {
    constructor(materials) {
        super();
        this.material = materials
        this.faces = []
        this.draw()

    }
    draw(){
        while(this.faces.length > 0){
            this.remove(this.faces[0]);
            this.faces.splice(0,1);
        }
        this.setPlane("y",  Math.PI * 0.5, this.material[0]); //+x
        this.setPlane("y", -Math.PI * 0.5, this.material[1]); //-x
        this.setPlane("x",  -Math.PI * 0.5, this.material[2]); //+y
        this.setPlane("x",  Math.PI * 0.5, this.material[3]); //-y
        this.setPlane("y",  Math.PI, this.material[5]);// -z
        this.setPlane("y",  0, this.material[4]); //+z
    }

    setPlane(axis, angle, material) {
        if(material !== null) {
            let planeGeom = new THREE.PlaneGeometry(1, 1, 1, 1);
            planeGeom.translate(0, 0, 0.5);
            switch (axis) {
                case 'y':
                    planeGeom.rotateY(angle);
                    break;
                default:
                    planeGeom.rotateX(angle);
            }
            let plane = new THREE.Mesh(planeGeom, material);
            this.add(plane);
            this.faces.push(plane)
        }
    }

}
// THREE.PlaneBufferGeometry.prototype.toGrid = function() {
//     let segmentsX = this.parameters.widthSegments || 1;
//     let segmentsY = this.parameters.heightSegments || 1;
//     let indices = [];
//     for (let i = 0; i < segmentsY + 1; i++) {
//         let index11 = 0;
//         let index12 = 0;
//         for (let j = 0; j < segmentsX; j++) {
//             index11 = (segmentsX + 1) * i + j;
//             index12 = index11 + 1;
//             let index21 = index11;
//             let index22 = index11 + (segmentsX + 1);
//             indices.push(index11, index12);
//             if (index22 < ((segmentsX + 1) * (segmentsY + 1) - 1)) {
//                 indices.push(index21, index22);
//             }
//         }
//         if ((index12 + segmentsX + 1) <= ((segmentsX + 1) * (segmentsY + 1) - 1)) {
//             indices.push(index12, index12 + segmentsX + 1);
//         }
//     }
//     this.setIndex(indices);
//     return this;
// }
class TileGridWireFrame extends THREE.Mesh {
    constructor(size,orientation = "xz") {
        super()
        // var gridGeom = new THREE.PlaneBufferGeometry(width, height, width,height).toGrid();
        // this.grid = new THREE.LineSegments(gridGeom, new THREE.LineBasicMaterial({color: "yellow"}))
        this.grid = new THREE.GridHelper(size,size);
        this.add(this.grid);
        var planeGeom = new THREE.PlaneBufferGeometry(size, size, size,size);
        this.plane = new THREE.Mesh(planeGeom, new THREE.MeshBasicMaterial({color: "blue"}))
        this.plane.visible = false;
        this.plane.rotation.x = -Math.PI / 2;
        this.add(this.plane);
        if(orientation.includes("x") && orientation.includes("y")){
            this.rotation.x = Math.PI / 2;
        }else if(orientation.includes("y") && orientation.includes("z")){
            this.rotation.z = -Math.PI / 2;
        }
    }
}
THREE.TileGridWireFrame = TileGridWireFrame;
THREE.OpenCubeMesh = OpenCubeMesh;