
window.originalWindowPropertySet = Object.getOwnPropertyNames(window);


const SceneRenderer = require('./scenerenderer.js');
window.sceneRenderer = new SceneRenderer();


window.onload = function(){
    window.setupWindowPropertySet = Object.getOwnPropertyNames(window).filter(n => !window.originalWindowPropertySet.includes(n) )
    window.otherWindowPropertySet = ['getNewProperties', 'dir', 'dirxml', 'profile', 'profileEnd', 'clear', 'table', 'keys', 'values', 'debug', 'undebug', 'monitor', 'unmonitor', 'inspect', 'copy', 'queryObjects', '$_', '$0', '$1', '$2', '$3', '$4', 'getEventListeners', 'getAccessibleName', 'getAccessibleRole', 'monitorEvents', 'unmonitorEvents', '$', '$$', '$x'];
    window.originalWindowPropertySet = Object.getOwnPropertyNames(window);
    console.log("window.setupWindowPropertySet",  window.setupWindowPropertySet)

    window.getNewProperties = function(){
        return Object.getOwnPropertyNames(window).filter(n => ![...originalWindowPropertySet, ...setupWindowPropertySet, ...otherWindowPropertySet].includes(n))
    }
};