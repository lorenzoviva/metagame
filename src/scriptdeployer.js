var classes = require('./metaobjects.js');

class GlobalDeployer{
    constructor(global_shift = new THREE.Vector3(0,0,0), inter_child_space =  new THREE.Vector3(2,0,0), inter_layer_space =  new THREE.Vector3(0,0,-2)){
        this.global_shift = global_shift;
        this.inter_child_space = inter_child_space;
        this.inter_layer_space = inter_layer_space;
        this.modules = {}
        this.programs = {}
        this.objects = {}
        this.relations = {}
        this.classes = classes
    }
    import3DJSModuleWithDependencies(url, position= new THREE.Vector3(0,0,0)){
        var codeblock = null;
        var deplo = this;
        var added_modules = {};
        var child_added = {};
        var child_prop_i = 0;
        clientserver.httpGet(url, function (code) {
            // console.log("Lines of code read from module (" + url + ") :" , code.split(/\r\n|\r|\n/).length)
            var module = new classes.Module(code,  url.substr(5));
            codeblock = new classes.Module3D(module);
            let dependencyURLList = module.dependencies;
            // console.log("Found module dependencies: ", dependencyURLList)
            var module_position =  new THREE.Vector3(position.x + deplo.global_shift.x,
                position.y + deplo.global_shift.y,
                position.z + deplo.global_shift.z)
            codeblock.setPositionGrid(module_position);
            for(var dependency_i = 0; dependency_i < dependencyURLList.length; dependency_i++){
                var dependency_position = new THREE.Vector3(position.x + deplo.inter_child_space.x*dependency_i + deplo.inter_layer_space.x,
                    position.y + deplo.inter_child_space.y*dependency_i + deplo.inter_layer_space.y,
                    position.z + deplo.inter_child_space.z*dependency_i + deplo.inter_layer_space.z)
                if(dependencyURLList[dependency_i].startsWith("/src/")){
                    child_added = deplo.import3DJSModuleWithDependencies(dependencyURLList[dependency_i], dependency_position);
                    let child_properties = Object.getOwnPropertyNames(child_added);
                    for (child_prop_i = 0; child_prop_i < child_properties.length; child_prop_i++){
                        added_modules[child_properties[child_prop_i]] = child_added[child_properties[child_prop_i]];
                    }
                    codeblock.dependencies[dependencyURLList[dependency_i]] = child_added;
                }else{
                    child_added = deplo.createStubModule(dependencyURLList[dependency_i], dependency_position)
                    let child_properties = Object.getOwnPropertyNames(child_added);
                    for (child_prop_i = 0; child_prop_i < child_properties.length; child_prop_i++){
                        added_modules[child_properties[child_prop_i]] = child_added[child_properties[child_prop_i]];
                    }
                    codeblock.dependencies[dependencyURLList[dependency_i]] = child_added;
                }
            }

        });
        if(codeblock !== null) {
            this.modules[url] = codeblock;
            added_modules[url] = codeblock;
        }
        this.importCodeFromModules(added_modules);
        return added_modules;
    }
    importRelation(object, relation, shape="arc", height=5){
        //console.log("Importing relation: ", object, relation)
        let link = new classes.Relation(object, relation);
        link.shape = shape;
        link.height = height;
        link.color = new classes.Color().randomLight().toString();
        let link3D = new classes.Relation3D(link);
        object.relations[link3D.name] = link3D;
        relation.relations[link3D.name] = link3D;
        this.relations[link3D.name] = link3D;
        link3D.hide();
        return link;
    }
    showRelations(object3D){
        let relation_names = Object.getOwnPropertyNames(object3D.relations);
        for (var relation_i = 0; relation_i < relation_names.length; relation_i++){
            let relation = object3D.relations[relation_names[relation_i]];
            relation.show();
        }
    }
    hideRelations(object3D){
        let relation_names = Object.getOwnPropertyNames(object3D.relations);
        for (var relation_i = 0; relation_i < relation_names.length; relation_i++){
            let relation = object3D.relations[relation_names[relation_i]];
            relation.hide();
        }
    }
    hideAllRelations(){
        let relation_names = Object.getOwnPropertyNames(this.relations);
        for (var relation_i = 0; relation_i < relation_names.length; relation_i++){
            let relation = this.relations[relation_names[relation_i]];
            relation.hide();
        }
    }
    import3DJSModule(url, position= new THREE.Vector3(0,0,0)){
        var codeblock = null;
        clientserver.httpGet(url, function (code) {
            // console.log("Lines of code read from module (" + url + ") :", code.split(/\r\n|\r|\n/).length)
            var module = new classes.Module(code, url.substr(5));
            codeblock = new classes.Module3D(module);
            codeblock.setPositionGrid(position);
        });
        if(codeblock !== null) {
            this.modules[url] = codeblock;
        }
        return codeblock;
    }
    import3DJSDependencies(module3D){
        let module = module3D.object;
        let dependencyURLList = module.dependencies;
        //console.log("Found module dependencies: ", dependencyURLList)
        let position = module3D.getPositionGrid();
        for(var dependency_i = 0; dependency_i < dependencyURLList.length; dependency_i++){
            var dependency_position = new THREE.Vector3(position.x + this.inter_child_space.x*dependency_i + this.inter_layer_space.x,
                position.y + this.inter_child_space.y*dependency_i + this.inter_layer_space.y,
                position.z + this.inter_child_space.z*dependency_i + this.inter_layer_space.z)
            console.log("Deploy dependency: ", dependencyURLList[dependency_i], " at: ", dependency_position)
            if( module3D.dependencies[dependencyURLList[dependency_i]] === null){
                var child_added = null;
                if(dependencyURLList[dependency_i].startsWith("/src/")){
                    child_added = this.import3DJSModule(dependencyURLList[dependency_i], dependency_position);
                }else{
                    child_added = this.createStubModule(dependencyURLList[dependency_i], dependency_position);
                }
                module3D.dependencies[dependencyURLList[dependency_i]] = child_added;
                console.log("Dependencies loaded: ", module3D.dependencies)
                this.importRelation(module3D, child_added,"arc", -5)
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
        return codeblock;
    }
    importCodeFromModules(modules){
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
            //console.log("Importing instruction n°: " + instruction_i, codeblock)
            var link = this.importRelation(module3D, codeblock)
            var code_relation_forward = new classes.CodeRelation(codeblock, module3D, codeblock.object, module3D.object.fc_child[instruction_i])
            var code_relation_backward = new classes.CodeRelation(module3D, codeblock, module3D.object, codeblock.object.getFirstObject3DParent())
            link.code.push(code_relation_forward);
            link.code.push(code_relation_backward);
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
            if(codeObjects[instruction_i].object3D === undefined) {
                code_position = new THREE.Vector3(code_position.x + this.inter_child_space.x, code_position.y + this.inter_child_space.y, code_position.z + this.inter_child_space.z);
                var codeblock = new classes.Code3D(codeObjects[instruction_i]);
                codeblock.setPositionGrid(code_position);
                var link = this.importRelation(code3D, codeblock, "arc", -5)
                var code_relation_forward = new classes.CodeRelation(codeblock, code3D, codeblock.object, code3D.object.fc_child[instruction_i]);
                var code_relation_backward = new classes.CodeRelation(code3D, codeblock, code3D.object, codeblock.object.getFirstObject3DParent());
                link.code.push(code_relation_forward);
                link.code.push(code_relation_backward);

            }
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
            var link = this.importRelation(code3D, codeblock,"arc", -5)
            var code_relation_forward = new classes.CodeRelation(codeblock, code3D, codeblock.object, code3D.object.fc_params[instruction_i]);
            var code_relation_backward = new classes.CodeRelation(code3D, codeblock, code3D.object, codeblock.object.getFirstObject3DParent());
            link.code.push(code_relation_forward);
            link.code.push(code_relation_backward);
        }
    }
    importDynamic3DJS(code,  position= new THREE.Vector3(0,0,0)){
        // console.log("Code: ", code)
        var codeblock = new classes.Code3D(code);
        //console.log("Codeblock: ", codeblock)
        codeblock.setPositionGrid(position);
    }
    require3D(res){
        let url = classes.Module.localURLToGlobal(res);
        if(url.startsWith("/src/")){
            if(Object.getOwnPropertyNames(deployer.modules).includes(url)){
                var module3D = deployer.modules[url];
                geval(module3D.object.ast.node.code)
                return module.exports;
            } else {
                deployer.import3DJSModuleWithDependencies(url);
                return deployer.require3D(res);
            }
        }else{
            return {};
        }
    }
    importObject(object, position, scale=new THREE.Vector3(1,1,1), parent=scene, identifier="", type=classes.Object3D.constructor){
        // console.log("Deploy object: ", object, " at: ", position )
        if(parent === scene){
            position.x += this.global_shift.x;
            position.y += this.global_shift.y;
            position.z += this.global_shift.z;
        }
        // console.log("Deploy object corrected position at: ", position )

        return this.to3D.apply(object, [position, scale, parent, identifier, type])
    }
    getObject3DType(object){
        var objectType = "";
        if(object === undefined){
            objectType = "Undefined3D"
        }else if(object === null){
            objectType = "Null3D"
        }else{
            objectType = object.constructor.name + "3D"
        }
        return objectType;
    }
    to3D(position, scale=new THREE.Vector3(1,1,1), parent=scene, identifier="", type=classes.Object3D.constructor){
        var object = this;
        var object3D = null;
        if(type !== classes.Object3D.constructor){
            object3D = new type(object, parent, identifier);
            object3D.setObject(object);
            object3D.setPositionGrid(position)
        }else{
            var objectType = deployer.getObject3DType(object)
            try{
                // console.log("try creating: ",objectType, parent);
                if(objectType === classes.Object3D.name){
                    let color = new classes.Color().randomLight();
                    let side_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.classes.Object3D.getTextTexture((object === undefined || object === null ?'undefined':identifier),"rgb(0,0,0)", color, true) });
                    let darker_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.classes.Object3D.getTextTexture((object === undefined || object === null ?'undefined':(object.serialize === undefined?JSON.stringify(new classes.ObjectWrapper(object).serialize(), null, 2):JSON.stringify(object.serialize(), null, 2))),"rgb(0,0,0)" , color.darker(0.1), false, true) });
                    let text_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.classes.Object3D.getTextTexture(objectType ,"rgb(0,0,0)" , color.lighter(0.2), true) } );
                    var mesh = new THREE.OpenCubeMesh([null, text_material, null, darker_material, null, side_material]);
                    // console.log("constructing: ",objectType, object, parent, identifier, mesh);
                    object3D = new deployer.classes[objectType](object, parent, identifier, mesh, objectType, objectType,{},{},[]);
                       // console.log("constructing: ",objectType, object3D);
                }else{
                    object3D = new deployer.classes[objectType](object, parent, identifier);
                     // console.log("constructing: ",objectType, object3D);

                }
                object3D.setPositionGrid(position);
                object3D.mesh.scale.x = scale.x;
                object3D.mesh.scale.y = scale.y;
                object3D.mesh.scale.z = scale.z;
                object3D.setPositionInternal(new THREE.Vector3(scale.x/2,scale.y/2,scale.z/2))
                // console.log("finished creating: ",objectType, object3D);
                // object3D.setPositionInternal(new THREE.Vector3(scale.x,scale.y,scale.z))

                // realObject.setObject(object)
            } catch (e) {
                if(e instanceof TypeError){
                    // console.log("Creating constructor for class: " + objectType+ " parent:",  parent, " object: " , object , " error: ", e);
                    var depth = 0;
                    var node = parent;
                    while (node !== scene){
                        depth++;
                        node = node.parent;
                    }
                    deployer.setGenericMeshGetter(object, objectType);
                    let C = geval("class " + objectType + " extends deployer.classes.Object3D{\n" +
                                "   constructor(object, parent, identifier){\n" +
                                "       super(object, parent, identifier, object.getGenericMesh(parent, identifier), \""+objectType+"\", \"" + objectType +"\", {},{},[]);\n" +
                                "    }\n" +
                                "}; "+ objectType);

                    Object.defineProperty (C, 'name', {value: objectType});
                    deployer.classes[objectType] = C;
                    // console.log("Created constructor for class: " + objectType+ ", restarting to3D...");
                    return deployer.to3D.apply(object, [position, scale,  parent, identifier]);
                }else{
                    // e.constructor.prototype.to3D = to3D;
                    // return e.to3D(position, scale, parent);
                    console.log("A different error occurred: " + e + ", restarting to3D...");
                    return deployer.to3D.apply(e, [position, scale, parent, identifier])
                }
            }

        }
        return object3D;
    }
    setGenericMeshGetter(object, objectType){
        // console.log("setGenericMeshGetter(", object, ",", objectType, ")")
        let color = new classes.Color().randomLight();
        object.constructor.prototype.getGenericMesh = function getGenericMesh(parent, identifier){
            // console.log("getGenericMesh(", this, ",", parent, ")")
            let side_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.classes.Object3D.getTextTexture((this === undefined || this === null ?'undefined':identifier),"rgb(0,0,0)" , color, true) });
            let strRepresentation = 'undefined';
            if(this !== undefined && this !== null){
                const getCircularReplacer = () => {
                    const seen = new WeakSet();
                    return (key, value) => {
                        if (typeof value === "object" && value !== null) {
                            if (seen.has(value)) {
                                return;
                            }
                            seen.add(value);
                        }
                        return value;
                    };
                };
                try {
                    if (this.serialize === undefined) {
                        strRepresentation = JSON.stringify(new classes.ObjectWrapper(this).serialize(), getCircularReplacer(), 2);
                    } else {
                        strRepresentation = JSON.stringify(this.serialize(), getCircularReplacer(), 2);
                    }
                }catch (e){
                    strRepresentation = "" + this;
                }
            }
            if(!strRepresentation)strRepresentation="\"\""
            let darker_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.classes.Object3D.getTextTexture(strRepresentation, "rgb(0,0,0)" , color.darker(0.1), false, true) });
            let text_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.classes.Object3D.getTextTexture(objectType,"rgb(0,0,0)" , color.lighter(0.2), true) } );
            var mesh = new THREE.OpenCubeMesh([null, text_material, null, darker_material, null, side_material])
            return mesh;
        }
    }
    importGrid(object={size: 40, orientation: "xz"}){
        this.grid = new classes.Grid3D(object);
    }
    importFromIdentifier(identifier, position = new THREE.Vector3(0,0,0)){
        var module = searchInContext("this['" + identifier + "']", this.modules);
        if(module !== undefined){
           // console.log("Found " + identifier + " in modules");
            return this.importDynamic3DJS(module, position);
        }
        var code = searchInContext("this['" + identifier + "']", this.programs);
        if(code !== undefined) {
            // console.log("Found " + identifier + " in code");
            return this.importDynamic3DJS(code, position);
        }
        var object = searchInContext("this." + identifier, this.objects);
        if(object !== undefined) {
            // console.log("Found " + identifier + " in objects");
            return this.importObject(object, position)
        }
        var class_definition = searchInContext("this." + identifier, this.classes);
        if(class_definition !== undefined){
            // console.log("Found " + identifier + " in classes");
            return this.importDynamic3DJS(class_definition, position);
        }
    }
    getObjectsAtPosition(position){
        for (var obj_i = 0; obj_i < this.objects.length; obj_i++){
            if (this.objects[obj_i].getPositionGrid() === position){
                return this.objects[obj_i];
            }
        }
    }

    getObject3D(){
        return this.classes.Object3D;
    }
    getObject(name){
        //BE CAREFUL WHEN REFACTORING (used in eval at metaobjects.js)
        return this.objects[name]
    }
    removeRelation(relation){
        delete this.relations[relation.name];
        delete relation.object.from.relations[relation.name];
        delete relation.object.to.relations[relation.name];
    }
    removeProgram(program){
        delete this.programs[program.name];
    }
    removeObject(object){
        delete this.objects[object.name];
    }
    addObject(object){
        this.objects[object.name] = object;
    }
    addProgram(program){
        this.programs[program.name] = program;
    }
    startMovingObjects(objects){
        this.grid.object.active = true;
        this.grid.object.placing = objects;
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