const clientserver = require('./clientserver.js');
var classes = require('./metaobjects.js');

class Deployer{
    constructor(global_shift = new THREE.Vector3(0,0,0)) {
        this.global_shift = global_shift;
    }
}
class ModuleDeployer extends Deployer{
    constructor(global_shift = new THREE.Vector3(0,0,0), inter_child_space =  new THREE.Vector3(2,0,0), inter_layer_space =  new THREE.Vector3(0,0,-2)){
        super(global_shift);
        this.inter_child_space = inter_child_space;
        this.inter_layer_space = inter_layer_space;
        this.modules = {}
    }
    import3DJSModule(url, position= new THREE.Vector3(0,0,0)){
        var codeblock = null;
        var code_deployer = this;
        clientserver.httpGet(url, function (code) {
            console.log("Code read: " , code.split(/\r\n|\r|\n/).length)
            var module = new classes.Module(code,  url.substr(5));
            let dependencyURLList = module.getDependencyURLList();
            console.log("FOUND DEPENDENCIES: ", dependencyURLList)
            codeblock = new classes.Module3D(module);
            var module_position =  new THREE.Vector3(position.x + code_deployer.global_shift.x,
                position.y + code_deployer.global_shift.y,
                position.z + code_deployer.global_shift.z)
            codeblock.setPositionGrid(module_position);
            for(var dependency_i = 0; dependency_i < dependencyURLList.length; dependency_i++){
                var dependency_position = new THREE.Vector3(position.x + code_deployer.inter_child_space.x*dependency_i + code_deployer.inter_layer_space.x,
                    position.y + code_deployer.inter_child_space.y*dependency_i + code_deployer.inter_layer_space.y,
                    position.z + code_deployer.inter_child_space.z*dependency_i + code_deployer.inter_layer_space.z)
                if(dependencyURLList[dependency_i].startsWith("/src/")){
                    code_deployer.import3DJSModule(dependencyURLList[dependency_i], dependency_position);
                }else{
                    code_deployer.createStubModule(dependencyURLList[dependency_i], dependency_position)
                }
            }

        });
        if(codeblock !== null) this.modules[url] = codeblock;
    }

    createStubModule(url, position){
        var module = new classes.Module("'stub'",  url);
        var codeblock = new classes.Module3D(module);
        var module_position =  new THREE.Vector3(position.x + this.global_shift.x,
            position.y + this.global_shift.y,
            position.z + this.global_shift.z)
        codeblock.setPositionGrid(module_position);
        this.modules[url] = codeblock;

    }
    importDynamic3DJS(code,  position= new THREE.Vector3(0,0,0)){
        console.log("Code: ", code)
        var codeblock = new classes.Code3D(code);
        console.log("Codeblock: ", codeblock)
        codeblock.setPositionGrid(position);
    }

}
class CodeDeployer extends Deployer{
    constructor(global_shift = new THREE.Vector3(0,0,0), inter_child_space =  new THREE.Vector3(2,0,0), inter_layer_space =  new THREE.Vector3(0,0,-2)){
        super(global_shift);
        this.inter_child_space = inter_child_space;
        this.inter_layer_space = inter_layer_space;
        this.programs = {}
    }
    importDynamic3DJS(code,  position= new THREE.Vector3(0,0,0)){
        console.log("Code: ", code)
        var codeblock = new classes.Code3D(code);
        console.log("Codeblock: ", codeblock)
        codeblock.setPositionGrid(position);
    }
    require3D(res){
        let url = classes.Module.localURLToGlobal(res);
        if(url.startsWith("/src/")){
            if(Object.getOwnPropertyNames(deployer.module_deployer.modules).includes(url)){
                var module3D = deployer.module_deployer.modules[url];
                geval(module3D.object.ast.node.code)
                return module.exports;
            } else {
                deployer.module_deployer.import3DJSModuleWithDependencies(url);
                return deployer.module_deployer.require3D(res);
            }
        }else{
            return {};
        }
    }
}
class ObjectDeployer extends Deployer{
    constructor(global_shift = new THREE.Vector3(0,0,0), inter_space =  new THREE.Vector3(2,0,0)) {
        super(global_shift);
        this.inter_space = inter_space;
        this.objects = {}
    }
    getAllMesh(){
        var identifiers = Object.getOwnPropertyNames(this.objects);
        var result = [];
        for (var i = 0; i < identifiers.length; i++){
            result.push(this.objects[identifiers[i]].mesh);
        }
        return result;
    }
    to3D(position, scale=new THREE.Vector3(1,1,1), parent=scene,  type=classes.Object3D.constructor){
        var object = this;
        var object3D = null;
        if(type !== classes.Object3D.constructor){
            object3D = type();
            object3D.setObject(object);
            object3D.setPositionGrid(position)
        }else{
            var objectType = "";
            if(object === undefined){
                objectType = "Undefined3D"
            }else if(object === null){
                objectType = "Null3D"
            }else{
                objectType = object.constructor.name + "3D"
            }
            try{
                object3D = new classes[objectType](object, parent);
                object3D.setPositionGrid(position);
                object3D.mesh.scale.x = scale.x;
                object3D.mesh.scale.y = scale.y;
                object3D.mesh.scale.z = scale.z;
                object3D.setPositionInternal(new THREE.Vector3(scale.x/2,scale.y/2,scale.z/2))
                // object3D.setPositionInternal(new THREE.Vector3(scale.x,scale.y,scale.z))

                // realObject.setObject(object)
            } catch (e) {
                if(e instanceof TypeError){
                    let color = 'rgb('+Math.floor(128+Math.random()*128)+","+Math.floor(128+Math.random()*128)+","+Math.floor(128+Math.random()*128)+")"
                    var depth = 0;
                    var node = parent;
                    while (node !== scene){
                        depth++;
                        node = node.parent;
                    }
                    let C = geval("class " + objectType + " extends deployer.class_deployer.classes.Object3D{" +
                        "constructor(object, parent){\n" +
                        "    let transparent_material = new THREE.MeshBasicMaterial({color: '"+color+"',  side: THREE.DoubleSide });\n" +
                        "    let text_material = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: deployer.class_deployer.classes.Object3D.getTextTexture('" + objectType + "',\"rgb(0,0,0)\" , '"+color+"', true) } );\n" +
                        "    let other_material = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0, emissive: '"+color+"', color: '"+color+"'});\n" +
                        "    var mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),  [other_material, text_material, other_material, transparent_material, other_material, transparent_material])\n" +
                        "    super('" + objectType + "', '" + objectType + "', {},{},[],object, mesh, parent);\n" +
                        "}" +
                    "}; "+ objectType);

                    // let C = class extends classes.Object3D{
                    //     constructor(object, parent){
                    //         // let transparent_material = new THREE.MeshLambertMaterial({ transparent: true, opacity: (depth/2)+0.5, emissive: color, color: color,  side: THREE.DoubleSide });
                    //         let transparent_material = new THREE.MeshBasicMaterial({color: color,  side: THREE.DoubleSide });
                    //         let text_material = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: classes.Object3D.getTextTexture(objectType,"rgb(0,0,0)" , color, true) } );
                    //
                    //         let other_material = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0, emissive: color, color: color});
                    //         var mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),  [other_material, text_material, other_material, transparent_material, other_material, transparent_material])
                    //         super(objectType, objectType, {},{},[],object, mesh, parent);
                    //     }
                    // };
                    Object.defineProperty (C, 'name', {value: objectType});
                    classes[objectType] = C;
                    // console.log("Creating obj: " + objectType+ " as it was not found in ", classes, e);
                    return deployer.object_deployer.to3D.apply(object, [position, scale, parent]);
                }else{
                    console.log("ERROR: ",  e)
                    // e.constructor.prototype.to3D = to3D;
                    // return e.to3D(position, scale, parent);
                    return deployer.object_deployer.to3D.apply(e, [position, scale, parent])
                }
            }

        }
        return object3D;
    }

}
class ClassDeployer extends Deployer{
    constructor(global_shift = new THREE.Vector3(0,0,0), inter_space =  new THREE.Vector3(2,0,0)){
        super(global_shift);
        this.inter_space = inter_space;
        this.classes = classes
    }
}
class GlobalDeployer extends Deployer{
    constructor() {
        super(new THREE.Vector3(0,0,0));
        this.module_deployer = new ModuleDeployer(new THREE.Vector3(5,0,-5));
        this.code_deployer = new CodeDeployer(new THREE.Vector3(-5,0,-5));
        this.object_deployer = new ObjectDeployer(new THREE.Vector3(5,0,5));
        this.class_deployer = new ClassDeployer;(new THREE.Vector3(-5,0,5));
    }
    // import3DJSModule(url, position= new THREE.Vector3(0,0,0)){
    //     var modules = this.module_deployer.import3DJSModule(url, position);
    //
    // }
    importFromIdentifier(identifier){
        try{
            var module = evalInContext("this['" + identifier + "']", this.module_deployer.modules);
            console.log("Found " + identifier + " in modules");
            return this.module_deployer.importDynamic3DJS(module);
        }catch (e) {
            try{
                var code = evalInContext("this['" + identifier + "']", this.code_deployer.programs);
                console.log("Found " + identifier + " in code");
                return this.code_deployer.importDynamic3DJS(code);
            }catch (e) {
                try {
                    var object = evalInContext("this." + identifier, this.object_deployer.objects);
                    console.log("Found " + identifier + " in objects");
                    return this.object_deployer.to3D.apply(object, [])
                } catch (e) {
                    try {
                        var class_definition = evalInContext("this." + identifier, this.class_deployer.classes);
                        console.log("Found " + identifier + " in classes");
                        return this.module_deployer.importDynamic3DJS(class_definition);
                    } catch (error) {
                        console.log("Did not found " + identifier);

                        return this.object_deployer.to3D.apply(error, []);
                    }
                }
            }
        }
    }

}
function evalInContext(js, context) {
    //# Return the results of the in-line anonymous function we .call with the passed context
    return function() { return eval(js); }.call(context);
}



module.exports = GlobalDeployer;