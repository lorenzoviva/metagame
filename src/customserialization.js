var classes = require("./codeobjects.js");
var utils = require("util")
window.nodeutils = utils;
classes.ObjectWrapper = class ObjectWrapper{
    constructor(object) {
        this.object = object;
       // console.log("object: ", object)

    }
    // removeCyclic () {
    //     var seenObjects = [];
    //     var new_object = {};
    //     function detect (obj, parents=[]) {
    //         if (obj && typeof obj === 'object') {
    //             if (seenObjects.indexOf(obj) !== -1) {
    //                 return true;
    //             }
    //             seenObjects.push(obj);
    //             var layer_object = new_object;
    //             for (var parent of parents){
    //                 layer_object = layer_object[parent]
    //             }
    //             for (var key in obj) {
    //                 let cyclic = false;
    //                 if (obj.hasOwnProperty(key) && detect(obj[key], parents.concat([key]))) {
    //                     console.log("key: ", key, " of object: " , obj , " is cyclic")
    //                     cyclic = true;
    //                 }else{
    //                     layer_object[key] = obj[key];
    //                 }
    //                 return cyclic;
    //             }
    //         }
    //         return false;
    //     }
    //     if(detect(this.object)){
    //         return new_object;
    //     }else{
    //         return this.object;
    //     }
    //
    // }
    serialize(){
        // this.object = this.removeCyclic();

       // console.log("SERIALIZING:", this);
        if((this.object === null || this.object === undefined)
            || (this.object.constructor.name !== Object.name && this.object.constructor.toString().indexOf('[native code]') > -1)){//object to be serialize has a primitive type
           // console.log("STRINGIFY [NATIVE]: ", this.object);
            return this.object;
        }
        var that = {};
        const fields = Object.getOwnPropertyNames(this.object);
        for(var i = 0; i < fields.length; i++){
            if (this.object[fields[i]] instanceof classes.Object3D){
                that[fields[i]] = this.object[fields[i]].serialize(true);
            }else if (this.object[fields[i]] instanceof THREE.Object3D){
                that[fields[i]] = this.object[fields[i]].serialize();
            }else if (this.object[fields[i]] instanceof classes.Code){
                that[fields[i]] =  this.object[fields[i]].serialize();
            }else{
               // console.log("SERIALIZE: ", this.object[fields[i]]);
                that[fields[i]] = new classes.ObjectWrapper(this.object[fields[i]]).serialize();
            }
        }
        that.type = this.object.constructor.name;
       // console.log("STRINGIFY: ", that);
        return that;
    }
    static deserialize(object){
        var deserialized = null;

        if((object === null || object === undefined) || (object.constructor.name !== Object.name && object.constructor.toString().indexOf('[native code]') > -1) || (object.hasOwnProperty("type") && object.type === Object.name)){//object to be serialize has a primitive type
            object && object.hasOwnProperty("type") && delete object.type;
            object && object.hasOwnProperty("meta_type") && delete object.type;
            console.log("DESERIALIZED (obj -> ObjectWrapper):",object);
            deserialized = object;
        }else {
            if(object.hasOwnProperty("meta_type") && geval(object.meta_type).deserialize){
                console.log("DESERIALIZING (ObjectWrapper -> "+ object.meta_type + "): ", object);
                deserialized = geval(object.meta_type).deserialize(object, true);
                console.log("DESERIALIZED (ObjectWrapper -> "+ object.meta_type + "): ", object);
                delete object.type;
                delete object.meta_type;
            }else if(object.hasOwnProperty("type") && deployer.classes[object.type] && deployer.classes[object.type].deserialize) {
                console.log("DESERIALIZING (ObjectWrapper -> "+ object.type + "): ", object);
                deserialized = deployer.classes[object.type].deserialize(object);
                console.log("DESERIALIZED (ObjectWrapper -> "+ object.type + "): ", object);
                delete object.type;
            } else{
                console.log("DESERIALIZING (json -> ObjectWrapper): ", object);
                const fields = Object.getOwnPropertyNames(object);
                for(var i = 0; i < fields.length; i++){
                    object[fields[i]] = classes.ObjectWrapper.deserialize(object[fields[i]]);
                }
                console.log("DESERIALIZED (json -> ObjectWrapper):",object)
                delete object.type;
                delete object.meta_type;
                deserialized = object;
            }
        }
        return deserialized;

    }
}
THREE.Object3D.prototype.serialize = function (reference=true) {
   // console.log("SERIALIZING:", this, reference);
    return  {meta_type:"THREE.Object3D", type:this.constructor.name,uuid:this.uuid};
}

classes.Object3D.prototype.serialize = function(reference=false){
   // console.log("SERIALIZING:", this, reference);
    if(reference){
        return  {meta_type:"deployer.classes." + this.constructor.name, type:this.constructor.name, name:this.name};
    }
    var that = {};
    const fields = Object.getOwnPropertyNames(this);
    for(var i = 0; i < fields.length; i++){
        if (this[fields[i]] instanceof classes.Object3D){
            that[fields[i]] = this[fields[i]].serialize(true);
        }else if (this[fields[i]] instanceof THREE.Object3D){
            that[fields[i]] = this[fields[i]].serialize();
        }else if (this[fields[i]] instanceof classes.Code){
            that[fields[i]] =  this[fields[i]].serialize();
        }else{
           // console.log("SERIALIZE: ", this[fields[i]]);
            that[fields[i]] = new classes.ObjectWrapper(this[fields[i]]).serialize();
        }
    }
    that.type = this.constructor.name;
   // console.log("STRINGIFY: ", that);
    return that;
}
classes.Code.prototype.serialize = function(reference=true){
   // console.log("SERIALIZING:", this, reference);
    return {meta_type:"deployer.classes." + this.constructor.name, type:this.constructor.name, code:this.node.code};
}
THREE.Object3D.deserialize = function (object, reference=true) {
   // console.log("DESERIALIZING (THREE.Object3D): ",object)
    let that = scene.findObjectByUUID(object.uuid);
   // console.log("DESERIALIZED  (THREE.Object3D):",that)
    return that;
}
THREE.Object3D.prototype.findObjectByUUID = function(uuid){
    if(this.uuid === uuid){
        return this;
    }else{
        for (var i = 0; i < this.children.length; i++){
            let found = this.children[i].findObjectByUUID(uuid);
            if(found){
                return found;
            }
        }
        return false;
    }
}
classes.Code.deserialize = function(object, reference=true){
   // console.log("DESERIALIZING (Code):",object)

    let that = new classes[object.type](object.code);
   // console.log("DESERIALIZED (Code):",that)

    return that;
}
classes.Object3D.deserialize = function(object, reference=false){
   // console.log("DESERIALIZING (Object3D):",object, reference)
    var that = object;

    if(reference){
        // console.log("DESERIALIZED:",deployer.objects[that.name], reference)
        return deployer.objects[that.name];
    }
    Object.assign(that, this, object);

    const fields = Object.getOwnPropertyNames(that);
    for(var i = 0; i < fields.length; i++){
        that[fields[i]] = classes.ObjectWrapper.deserialize(that[fields[i]]);
    }
   // console.log("DESERIALIZED  (Object3D):",that, reference)
    return that;
}
// Object.prototype.serialize = function () {
//     return JSON.stringify(this);
// }