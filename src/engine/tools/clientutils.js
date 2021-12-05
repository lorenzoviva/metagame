const THREE = require("three");
window.arraySelect = function (array, projection) {
    var results = [];
    for (var i = 0; i < array.length; i++) {
        results.push(projection(array[i]));
    }
    return results;
};
window.arrayWhere =function (array, inclusionTest) {
    var results = [];
    for (var i = 0; i < array.length; i++) {
        if (inclusionTest(array[i]))
            results.push(array[i]);//from   www.j a  v a2 s. c om
    }
    return results;
};


THREE.Vector3.prototype.getRotated = function(v){
    var res = new THREE.Vector3(this.x, this.y, this.z);
    res.applyAxisAngle(new THREE.Vector3( 1, 0, 0 ), v.x);
    res.applyAxisAngle(new THREE.Vector3( 0, 1, 0 ), v.y);
    res.applyAxisAngle(new THREE.Vector3( 0, 0, 1 ), v.z);
    return res;
}