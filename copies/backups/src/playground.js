function f(a, b){
    return a+b;
}
var tre = f(1,2);
var x = {l:f, r: new THREE.Vector3(0,0,0), a:2, b:"element assssss  sssssss ssssss sssssssssss s\n sasssssssssssssss ss \"sssssssss\" sssssssss sssssssssss ssssssssssss sssssss sa sa", o:{a:1,b:2}, n:true, g:3.4, t:null}
var z = 2;
for(var l of Object.getOwnPropertyNames(x)){
    deployer.importObject(x[l], new THREE.Vector3(temp1.getPositionGrid().x,0,z),new THREE.Vector3(1,1,1), scene, l);
    z +=2;
}
x