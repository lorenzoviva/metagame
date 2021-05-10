var classes = require("./codeobjects.js");


classes.ObjectWrapper = class ObjectWrapper{
    constructor(object) {
        this.object = object;
       // console.log("object: ", object)

    }
    serialize(){
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
        if((object === null || object === undefined)
            || (object.constructor.name !== Object.name && object.constructor.toString().indexOf('[native code]') > -1)){//object to be serialize has a primitive type
           // console.log("DESERIALIZING [NATIVE]: ", object);
            return object;
        }else{
            // console.log("DESERIALIZING: ", object);

            const fields = Object.getOwnPropertyNames(object);
            for(var i = 0; i < fields.length; i++){
                if(Object.hasOwnProperty(object[fields[i]],"meta_type")){
                    let field_type = geval(object[fields[i]].meta_type);
                    if(field_type.deserialize){
                        object[fields[i]] = field_type.deserialize(object[fields[i]], true)
                    }
                }else {
                    object[fields[i]] = classes.ObjectWrapper.deserialize(object[fields[i]]);
                }
            }
           // console.log("DESERIALIZED:",object)
            return object;
        }
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
classes.Code.prototype.serialize= function(reference=true){
   // console.log("SERIALIZING:", this, reference);
    return {meta_type:"deployer.classes." + this.constructor.name, type:this.constructor.name, code:this.node.code};
}
THREE.Object3D.deserialize = function (object, reference=true) {
   // console.log("DESERIALIZING:",object)
    let that = scene.findObjectByUUID(object.uuid);
   // console.log("DESERIALIZED:",that)
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
   // console.log("DESERIALIZING:",object)
    let that = new classes[object.type](object.code);
   // console.log("DESERIALIZED:",that)

    return that;
}
classes.Object3D.deserialize = function(json, reference=false){
   // console.log("DESERIALIZING:",json, reference)

    if(reference){
        let that = deployer.objects[json.name];
       // console.log("DESERIALIZED:",that, reference)
        return that;
    }
    var that = JSON.parse(json);
    const fields = Object.getOwnPropertyNames(that);
    for(var i = 0; i < fields.length; i++){
        if(Object.hasOwnProperty(that[fields[i]], "meta_type")){
            let field_type = geval(that[fields[i]].meta_type);
            if(field_type.deserialize){
                that[fields[i]] = field_type.deserialize(that[fields[i]], true)
            }
        }else {
            that[fields[i]] = classes.ObjectWrapper.deserialize(that[fields[i]]);
        }
    }
   // console.log("DESERIALIZED:",that, reference)
    return that;
}
// Object.prototype.serialize = function () {
//     return JSON.stringify(this);
// }