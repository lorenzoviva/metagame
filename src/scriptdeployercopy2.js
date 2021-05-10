const clientserver = require('./clientserver.js');
var classes = require('./metaobjects.js');

class Deployer{
    constructor(global_shift = new THREE.Vector3(0,0,0)) {
        this.global_shift = global_shift;
    }
    deployManually(objects){

    }
}
class ModuleDeployer extends Deployer{
    constructor(global_shift = new THREE.Vector3(0,0,0), inter_child_space =  new THREE.Vector3(2,0,0), inter_layer_space =  new THREE.Vector3(0,0,-2)){
        super(global_shift);
        this.inter_child_space = inter_child_space;
        this.inter_layer_space = inter_layer_space;
        this.modules = {}
    }
    import3DJSModuleWithDependencies(url, position= new THREE.Vector3(0,0,0)){
        var codeblock = null;
        var code_deployer = this;
        var added_modules = {};
        var child_added = {};
        var child_prop_i = 0;
        clientserver.httpGet(url, function (code) {
            console.log("Lines of code read from module (" + url + ") :" , code.split(/\r\n|\r|\n/).length)
            var module = new classes.Module(code,  url.substr(5));
            codeblock = new classes.Module3D(module);
            let dependencyURLList = module.getDependencyURLList();
            console.log("Found module dependencies: ", dependencyURLList)
            var module_position =  new THREE.Vector3(position.x + code_deployer.global_shift.x,
                position.y + code_deployer.global_shift.y,
                position.z + code_deployer.global_shift.z)
            codeblock.setPositionGrid(module_position);
            for(var dependency_i = 0; dependency_i < dependencyURLList.length; dependency_i++){
                var dependency_position = new THREE.Vector3(position.x + code_deployer.inter_child_space.x*dependency_i + code_deployer.inter_layer_space.x,
                    position.y + code_deployer.inter_child_space.y*dependency_i + code_deployer.inter_layer_space.y,
                    position.z + code_deployer.inter_child_space.z*dependency_i + code_deployer.inter_layer_space.z)
                if(dependencyURLList[dependency_i].startsWith("/src/")){
                    child_added = code_deployer.import3DJSModuleWithDependencies(dependencyURLList[dependency_i], dependency_position);
                    let child_properties = Object.getOwnPropertyNames(child_added);
                    for (child_prop_i = 0; child_prop_i < child_properties.length; child_prop_i++){
                        added_modules[child_properties[child_prop_i]] = child_added[child_properties[child_prop_i]];
                    }
                }else{
                    child_added = code_deployer.createStubModule(dependencyURLList[dependency_i], dependency_position)
                    let child_properties = Object.getOwnPropertyNames(child_added);
                    for (child_prop_i = 0; child_prop_i < child_properties.length; child_prop_i++){
                        added_modules[child_properties[child_prop_i]] = child_added[child_properties[child_prop_i]];
                    }
                }
            }

        });
        if(codeblock !== null) {
            this.modules[url] = codeblock;
            added_modules[url] = codeblock;
        }
        return added_modules;
    }
    import3DJSModule(url, position= new THREE.Vector3(0,0,0)){
        var codeblock = null;
        clientserver.httpGet(url, function (code) {
            console.log("Lines of code read from module (" + url + ") :", code.split(/\r\n|\r|\n/).length)
            var module = new classes.Module(code, url.substr(5));
            codeblock = new classes.Module3D(module);
            codeblock.setPositionGrid(position);
        });
        if(codeblock !== null) {
            this.modules[url] = codeblock;
        }
    }
    import3DJSDependencies(module3D){
        let module = module3D.object;
        let dependencyURLList = module.getDependencyURLList();
        console.log("Found module dependencies: ", dependencyURLList)
        let position = module3D.getPositionGrid();
        for(var dependency_i = 0; dependency_i < dependencyURLList.length; dependency_i++){
            var dependency_position = new THREE.Vector3(position.x + this.inter_child_space.x*dependency_i + this.inter_layer_space.x,
                position.y + this.inter_child_space.y*dependency_i + this.inter_layer_space.y,
                position.z + this.inter_child_space.z*dependency_i + this.inter_layer_space.z)
            console.log("Deploy dependency: ", dependencyURLList[dependency_i], " at: ", dependency_position)

            if(dependencyURLList[dependency_i].startsWith("/src/")){
                this.import3DJSModule(dependencyURLList[dependency_i], dependency_position);
            }else{
                this.createStubModule(dependencyURLList[dependency_i], dependency_position);
            }
        }
    }
    createStubModule(url, position){
        var module_obj = {};
        var module = new classes.Module("'stub'",  url);
        var codeblock = new classes.Module3D(module);
        var module_position =  new THREE.Vector3(position.x + this.global_shift.x,
            position.y + this.global_shift.y,
            position.z + this.global_shift.z)
        codeblock.setPositionGrid(module_position);
        this.modules[url] = codeblock;
        module_obj[url] = codeblock;
        return module_obj;
    }

}
class CodeDeployer extends Deployer{
    constructor(global_shift = new THREE.Vector3(0,0,0), inter_child_space =  new THREE.Vector3(0,0,-2), inter_layer_space =  new THREE.Vector3(0,0,-2)){
        super(global_shift);
        this.inter_child_space = inter_child_space;
        this.inter_layer_space = inter_layer_space;
        this.programs = {}
    }
    importFromModules(modules){
        let modules_urls = Object.getOwnPropertyNames(modules);
        for (var module_i = 0; module_i < modules_urls.length; module_i++){
            var module3D = modules[modules_urls[module_i]];
            this.importFromModule(module3D)
        }
    }
    importFromModule(module3D){
        var module = module3D.object;
        var codeObjects = module.fc_child;
        var code_position = module3D.getPositionGrid();
        code_position.x += this.global_shift.x;
        code_position.y += this.global_shift.y;
        code_position.z += this.global_shift.z;
        for (var instruction_i = 0; instruction_i < codeObjects.length; instruction_i++){
            code_position = new THREE.Vector3(code_position.x + this.inter_child_space.x,code_position.y + this.inter_child_space.y,code_position.z + this.inter_child_space.z);
            var codeblock = new classes.Code3D(codeObjects[instruction_i]);
            codeblock.setPositionGrid(code_position);
        }
    }
    importCodeFromCode(code3D){
        var code = code3D.object;
        var codeObjects = code.fc_child;
        var code_position = code3D.getPositionGrid();
        code_position.x += this.global_shift.x;
        code_position.y += this.global_shift.y;
        code_position.z += this.global_shift.z;
        for (var instruction_i = 0; instruction_i < codeObjects.length; instruction_i++){
            code_position = new THREE.Vector3(code_position.x + this.inter_child_space.x,code_position.y + this.inter_child_space.y,code_position.z + this.inter_child_space.z);
            var codeblock = new classes.Code3D(codeObjects[instruction_i]);
            codeblock.setPositionGrid(code_position);
        }
    }
    importParametersFromCode(code3D){
        var code = code3D.object;
        var codeObjects = code.fc_params;
        var code_position = code3D.getPositionGrid();
        code_position.x += this.global_shift.x;
        code_position.y += this.global_shift.y;
        code_position.z += this.global_shift.z;
        for (var instruction_i = 0; instruction_i < codeObjects.length; instruction_i++){
            code_position = new THREE.Vector3(code_position.x + this.inter_child_space.x,code_position.y + this.inter_child_space.y,code_position.z + this.inter_child_space.z);
            var codeblock = new classes.Code3D(codeObjects[instruction_i]);
            codeblock.setPositionGrid(code_position);
        }
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
    // getAllMesh(){
    //     var identifiers = Object.getOwnPropertyNames(this.objects);
    //     var result = [];
    //     for (var i = 0; i < identifiers.length; i++){
    //         result.push(this.objects[identifiers[i]].mesh);
    //         if (this.objects[identifiers[i]].mesh instanceof THREE.OpenCubeMesh){
    //             result.push(...this.objects[identifiers[i]].mesh.children);
    //         }
    //     }
    //     return result;
    // }
    // getMeshes(object){
    //     var meshes = [];
    //     if (object.mesh instanceof THREE.OpenCubeMesh){
    //         result.push(
    //     }else{
    //
    //     }
    // }
    importObject(object, position, scale=new THREE.Vector3(1,1,1), parent=scene, type=classes.Object3D.constructor){
        console.log("Deploy object: ", object, " at: ", position )
        if(parent === scene){
            position.x += this.global_shift.x;
            position.y += this.global_shift.y;
            position.z += this.global_shift.z;
        }
        console.log("Deploy object corrected position at: ", position )

        return this.to3D.apply(object, [position, scale, parent, type])
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
                    let color = new classes.Color().randomLight();

                    var depth = 0;
                    var node = parent;
                    while (node !== scene){
                        depth++;
                        node = node.parent;
                    }
                    let C = geval("class " + objectType + " extends deployer.class_deployer.classes.Object3D{" +
                        "constructor(object, parent){\n" +
                        "    let side_material = new THREE.MeshBasicMaterial({color: '"+color+"',  side: THREE.DoubleSide });\n" +
                        "    let darker_material = new THREE.MeshBasicMaterial({color: '"+color.darker(0.1)+"',  side: THREE.DoubleSide });\n" +
                        "    let text_material = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: deployer.class_deployer.classes.Object3D.getTextTexture('" + objectType + "',\"rgb(0,0,0)\" , '"+color.lighter(0.2)+"', true) } );\n" +
                        "    var mesh = new THREE.OpenCubeMesh([null, text_material, null, darker_material, null, side_material])\n" +
                        "    super('" + objectType + "', '" + objectType + "', {},{},[],object, mesh, parent);\n" +
                        "}" +
                    "}; "+ objectType);
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
        this.module_deployer = new ModuleDeployer(new THREE.Vector3(0,0,0));
        this.code_deployer = new CodeDeployer(new THREE.Vector3(0,2,0));
        this.object_deployer = new ObjectDeployer(new THREE.Vector3(0,4,0));
        this.class_deployer = new ClassDeployer;(new THREE.Vector3(0,6,0));

    }
    // import3DJSModule(url, position= new THREE.Vector3(0,0,0)){
    //     var modules = this.module_deployer.import3DJSModule(url, position);
    //
    // }
    importGrid(object={size: 40, orientation: "xz"}){
        this.grid = new classes.Grid3D(object);
    }

    import3DJSModuleWithRelationships(url, position= new THREE.Vector3(0,0,0)){
        var added_modules = this.module_deployer.import3DJSModuleWithDependencies(url, position);
        this.code_deployer.importCodeFromModules(added_modules);
    }
    import3DJSModule(url, position= new THREE.Vector3(0,0,0)){
        this.module_deployer.import3DJSModule(url, position);
    }
    importFromIdentifier(identifier, position = new THREE.Vector3(0,0,0)){
        var module = searchInContext("this['" + identifier + "']", this.module_deployer.modules);
        if(module !== undefined){
            console.log("Found " + identifier + " in modules");
            return this.module_deployer.importDynamic3DJS(module, position);
        }
        var code = searchInContext("this['" + identifier + "']", this.code_deployer.programs);
        if(code !== undefined) {
            console.log("Found " + identifier + " in code");
            return this.code_deployer.importDynamic3DJS(code, position);
        }
        var object = searchInContext("this." + identifier, this.object_deployer.objects);
        if(object !== undefined) {
            console.log("Found " + identifier + " in objects");
            return this.object_deployer.importObject(object, position)
        }
        var class_definition = searchInContext("this." + identifier, this.class_deployer.classes);
        if(class_definition !== undefined){
            console.log("Found " + identifier + " in classes");
            return this.module_deployer.importDynamic3DJS(class_definition, position);
        }
    }


}
function searchInContext(js, context) {
    //# Return the results of the in-line anonymous function we .call with the passed context
    return function() {
        try {
            return eval(js);
        }catch (e) {
            return undefined;
        }
    }.call(context);
}



module.exports = GlobalDeployer;