window.CANNON = require('cannon');

function setupWorld(){
    window.world = new CANNON.World()
    world.gravity.set(0, -9.82, 0)//
}
function addBox(object3D){
    let positionGrid = object3D.getPositionGrid();
    object3D.body = new CANNON.Body({
        mass: 5, // kg
        position: new CANNON.Vec3(positionGrid.x, positionGrid.y, positionGrid.z), // m
        shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1)),
    });
    object3D.body.object3D = object3D;
    console.log("Physics body:", object3D.body)
    world.addBody(object3D.body)
}
function addPlane(grid){
    var groundBody = new CANNON.Body({
        mass: 0, // mass == 0 makes the body static
        position: new CANNON.Vec3(0, -2, 0), // m
        shape: new CANNON.Box(new CANNON.Vec3(grid.object.size, 1, grid.object.size)),
    });
    world.addBody(groundBody);
}
// function addPlane(grid){
//     var groundBody = new CANNON.Body({
//         mass: 0 // mass == 0 makes the body static
//     });
//     var groundShape = new CANNON.Plane();
//     groundBody.addShape(groundShape);
//     world.addBody(groundBody);
// }
var fixedTimeStep = 1.0 / 60.0; // seconds
var maxSubSteps = 3;
function onRender(dt){
    world.step(fixedTimeStep, dt, maxSubSteps);
    for (var body of world.bodies){
        var new_pos = new THREE.Vector3(body.position.x, body.position.y, body.position.z);
        if(body.object3D) body.object3D.setPositionGrid(new_pos)
    }
}
setupWorld();
console.log("Classes: ", deployer.classes)
module.exports = {addBox, addPlane, onRender};