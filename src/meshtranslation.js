class ObjectToMeshTranslator{
    constructor(object, args) {}
    render(object, args){}
}

class ObjectToMesh extends ObjectToMeshTranslator{
    // from deployer
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
    // from Object3D
    redraw(object, parent, identifier){
        // if(parent && parent !== scene && identifier){
        //     var newobj = {};
        //     this.parent = parent;
        //     this.identifier = identifier;
        //     //dont use setObject
        //     this.object = object;
        //     newobj[this.identifier] = object;
        //     return parent.redraw({...parent.object, ...newobj}, parent.parent, parent.identifier);
        // }
        var g_pos = this.getPositionGrid();
        var i_pos = this.getPositionInternal();
        var o_scale = this.mesh.scale;
        this.parent = parent;
        this.identifier = identifier;
        if(object?.getGenericMesh !== undefined){
            let mesh = object.getGenericMesh(parent, identifier);
            mesh.scale.x = o_scale.x;
            mesh.scale.y = o_scale.y;
            mesh.scale.z = o_scale.z;
            this.setMesh(mesh);
            this.setObject(object);
            this.setPositionGrid(g_pos);
            this.setPositionInternal(i_pos);
        }else{
            var objectType = deployer.getObject3DType(object);
            let color = new classes.Color().randomLight();
            let side_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.getObject3D().getTextTexture((object === undefined || object === null ?'undefined':identifier),"rgb(0,0,0)", color, true) });
            let darker_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.getObject3D().getTextTexture((object === undefined || object === null ?'undefined':(object.serialize === undefined?JSON.stringify(new classes.ObjectWrapper(object).serialize()):JSON.stringify(object.serialize()))),"rgb(0,0,0)" , color.darker(0.1), false, true) });
            let text_material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: deployer.getObject3D().getTextTexture(objectType ,"rgb(0,0,0)" , color.lighter(0.2), true) } );
            let mesh = new THREE.OpenCubeMesh([null, text_material, null, darker_material, null, side_material]);
            mesh.scale.x = o_scale.x;
            mesh.scale.y = o_scale.y;
            mesh.scale.z = o_scale.z;
            this.setMesh(mesh);
            this.setObject(object);
            this.setPositionGrid(g_pos);
            this.setPositionInternal(i_pos);
        }
    }
    // from Object3D
    objectSetup(){
        let depth = this.getDepth();
        // console.log("DEPTH: " + depth + " for  " + this.object );
        this.setupWatcher();
        if(depth < 1) {
            const excludes = ["watch", "unwatch"]
            const includes = ["__proto__"]
            var sub_objects = Object.getOwnPropertyNames(this.object);
            for(var exclude of excludes){
                if(sub_objects.includes(exclude)){
                    sub_objects.splice(sub_objects.indexOf(exclude),1)
                }
            }
            for(var include of includes){
                if(this.object[include] !== undefined){
                    sub_objects.push(include);
                }
            }
            // var sub_scale = this.mesh.geometry.parameters.width / (2 * sub_objects.length)
            var sub_scale = this.mesh.scale.x / (2 * sub_objects.length)
            for (var child_i = 0; child_i < sub_objects.length; child_i++) {
                var sub_object = this.object[sub_objects[child_i]];
                this.actions["Relations>Add " + "this." + sub_objects[child_i]] = this.opt_relation_getter(this.object, sub_objects[child_i])
                // console.log("Spawning object child CLASS: ", this.constructor.name, " OBJECT: " + this.object + " MESH: ", this.mesh, " SUBS: " + child_i + "/"+sub_objects.length + " ("+sub_objects[child_i] + " = " + sub_object + ")")
                let sub_object_position = new THREE.Vector3(-(this.mesh.scale.x / 2) + sub_scale * child_i * 2 + (sub_scale*0.5),-(sub_scale*0.5),-(sub_scale*0.5));
                var sub_object3D =  deployer.importObject(sub_object, sub_object_position, new THREE.Vector3(sub_scale, sub_scale, sub_scale), this, sub_objects[child_i]);//
                this.childrens[sub_objects[child_i]] = sub_object3D;
            }
        }
        // if(this.parent !== scene){
        //     try {
        //         this.parent.object[this.identifier] = this.object;
        //     }catch (e){
        //         //not really important, other reference are defined. This only occurs on objects
        //     }
        // }
    }
}
class CodeToMesh extends ObjectToMeshTranslator{
    // from Code3D constructor
    render(object, args) {
        super.render(object, args);
        var mesh = new THREE.OpenCubeMesh(this.constructor.getTextMaterial(this))
    }
    // from Code3D
    static getTextMaterial(code3d) {
        var code = code3d.object;
        var node = code.node;
        var materials = [];
        // let parameters = { transparent: true, opacity: 0.8}
        let parameters = {side: THREE.DoubleSide}
        switch (node.type){
            case "VariableDeclaration":
                // parameters.emissive = 'rgb(125,54,0)';
                parameters.color = classes.VariableDeclaration.primaryColor;
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.type, classes.Code.backgroundColor, classes.Code.foregroundColor) } ));
                materials.push(null);
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.code, classes.Code.foregroundColor, classes.Code.backgroundColor) } ));
                materials.push(null);
                materials.push(null);
                // materials.push(null);//identifier
                let variableIdentifiers = code.getVariableIdentifiers();
                // console.log("CODE PARAMS:" ,code,  variableIdentifiers)
                if(variableIdentifiers.length > 0){
                    materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(variableIdentifiers.join(", "), classes.Identifier.secondaryColor, classes.Identifier.primaryColor, true) } ));
                }else {
                    materials.push(new THREE.MeshBasicMaterial(parameters));
                    // materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(code.fc_params[0].node.code, classes.Code.foregroundColor, classes.Code.backgroundColor, true) } ));
                }
                return materials;
            case "ExpressionStatement":
                // parameters.emissive = 'rgb(69,5,5)';
                parameters.color = classes.ExpressionStatement.primaryColor;
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.type, classes.Code.backgroundColor,  classes.ExpressionStatement.primaryColor) } ));
                materials.push(new THREE.MeshBasicMaterial(parameters));
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.code, classes.Code.foregroundColor, classes.Code.backgroundColor) } ));
                materials.push(null);
                materials.push(null);
                materials.push(null);
                return materials;
            case "ClassDeclaration":
                var className = code.getDeclaredClassName()
                // parameters.emissive = 'rgb(69,5,5)';
                parameters.color = classes.ClassDeclaration.primaryColor;
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.type, classes.Code.backgroundColor, classes.ClassDeclaration.primaryColor) } ));
                materials.push(new THREE.MeshBasicMaterial(parameters));
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.code, classes.Code.foregroundColor, classes.Code.backgroundColor) } ));
                materials.push(new THREE.MeshBasicMaterial(parameters));
                materials.push(null);
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(className, classes.Identifier.secondaryColor, classes.Identifier.primaryColor, true) } ));
                return materials;
            case "FunctionDeclaration":
                var functionName = code.getDeclaredFunctionName();
                if (functionName === ""){
                    functionName = code3d.identifier;
                }
                //console.log("FUNCTION DECLARATION:" ,code, functionName)
                // parameters.emissive = 'rgb(13,43,10)';
                parameters.color = classes.FunctionDeclaration.primaryColor;
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.type, classes.Code.backgroundColor, classes.FunctionDeclaration.primaryColor) } ));
                materials.push(new THREE.MeshBasicMaterial(parameters));
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.code, classes.Code.foregroundColor, classes.Code.backgroundColor) } ));
                materials.push(null);
                materials.push(null);
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(functionName, classes.Identifier.secondaryColor, classes.Identifier.primaryColor, true) } ));

                // materials.push(new THREE.MeshBasicMaterial(parameters));
                return materials;
            default:
                // parameters.emissive = 'rgb(0,61,45)';
                // parameters.color  = 'rgb(0,61,45)';
                parameters.color  = classes.Code.defaultColor;
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.type, classes.Code.backgroundColor, classes.Code.defaultColor) } ));
                materials.push(new THREE.MeshBasicMaterial(parameters));
                materials.push(new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, map: Object3D.getTextTexture(node.code, classes.Code.foregroundColor, classes.Code.backgroundColor) } ));
                materials.push(new THREE.MeshBasicMaterial(parameters));
                materials.push(null);
                materials.push(new THREE.MeshBasicMaterial(parameters));
                return materials;

        }

    }
}