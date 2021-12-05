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