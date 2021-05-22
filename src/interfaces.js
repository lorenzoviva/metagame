const clientserver = require('./clientserver.js');
var classes = require('./metaobjects.js');




const raycaster = new THREE.Raycaster()
const mouse = {polar: new THREE.Vector2(), cartesian: new THREE.Vector2(), event:"none"};


function onMouseMove( event ) {
    mouse.cartesian.x = event.clientX;
    mouse.cartesian.y = event.clientY;
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.polar.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.polar.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    mouse.event = 'move';

    raycaster.setFromCamera( mouse.polar, window.camera );

    // CLOSE MENU
    let menu = document.getElementById("menu");
    let left = Number(menu.style.left.replace('px', ''));
    let top = Number(menu.style.top.replace('px', ''));
    if (menu.style.display === 'unset' &&
        (mouse.cartesian.x < left - 10 || mouse.cartesian.x > left + menu.offsetWidth + 10 ||
            mouse.cartesian.y < top - 10 || mouse.cartesian.y > top + menu.offsetHeight + 10)) {
        closeMenu();
    }

    // MOVE OBJECTS
    deployer.grid && deployer.grid.onMouseMove(raycaster);

}
function onClick( event ) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.polar.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.polar.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    mouse.cartesian.x = event.clientX;
    mouse.cartesian.y = event.clientY;
    if(event.button === 0){
        mouse.event = 'downright';
    }else{
        mouse.event = 'downleft';
        onLeftClick(mouse);
    }
    return false;
}

function onLeftClick(mouse){
    // STOP MOVING OBJECTS
    deployer.grid && deployer.grid.onLeftClick();
    //OPEN MENU
    var object3DList = getInterceptingObjectList();
    if(allInterfacesClosed() && (deployer.grid === undefined || deployer.grid.object.active === false) && object3DList.length > 0){
        var options = object3DList[0].actions;
        showMenu(mouse, object3DList[0], options)
    }
}
function onRender(){
    if(scene === undefined) return;
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse.polar, window.camera );
    var object3DList = getInterceptingObjectList();
    // SHOW CONTEXT (names top-left) AND RELATIONS (wiring)
    deployer.hideAllRelations();
    if ( object3DList.length > 0){
        var nameList = "";
        for (var i = 0; i < object3DList.length; i++){
            nameList += object3DList[i].common_name + " > "
        }
        nameList = nameList.substr(0, (nameList.length - " > ".length));
        // if(nameList.length > 40){
        //     nameList= nameList.substr(0, 40) + "...";
        // }
        setInterfaceText("contextviewer",nameList)
        deployer.showRelations(object3DList[0]);
    }
}
function getInterceptingObjectList() {
    // SETUP OBJECTS TO BE INTERCEPTED
    var all_meshes = [];
    var new_meshes = scene.children.filter(function (element) {
        return  deployer.grid === undefined || element !== deployer.grid.mesh;
    });
    while (new_meshes.length > 0){
        var childs = [];
        all_meshes.push(...new_meshes);
        for (var mesh_index = 0; mesh_index < new_meshes.length; mesh_index++){
            if(new_meshes[mesh_index] !== undefined && new_meshes[mesh_index].children !== undefined){
                childs.push(...new_meshes[mesh_index].children);
            }
        }
        new_meshes = childs;
    }

    // SETUP THE INTERCEPTION ARRAY
    const intersects = raycaster.intersectObjects( all_meshes );
    let object3DList = [];
    for ( let i = 0; i < intersects.length; i ++ ) {
        // intersects[ i ].object.material.color.set( 0xff0000 );
        let intersectedObject = intersects[i].object;
        if (intersectedObject.userData.object3D !== undefined) {
            let items = intersectedObject.userData.object3D;
            if (!object3DList.includes(items)){
                object3DList.push(items);
            }
        }else if(intersectedObject.parent !== scene && intersectedObject.parent.userData.object3D !== undefined){
            let items = intersectedObject.parent.userData.object3D;
            if (!object3DList.includes(items)){
                object3DList.push(items);
            }
        }
        // console.log("INTERCEPTING: ",i , intersectedObject)

    }
    return object3DList;
}

function setInterfaceText(identifier, newText){
    document.getElementById(identifier).innerText = newText;
}

function allInterfacesClosed(){
    let menu = document.getElementById("menu");
    let editorpanel = document.getElementById("editorpanel");
    return menu.style.display !== 'unset' && editorpanel.style.display !== 'flex';
}

function showMenu(mouse, realObject, options) {
    let title = realObject.common_name;
    let menu = document.getElementById("menu");
    menu.innerHTML = '';

    menu.appendChild(document.createTextNode(title));

    menu.style.display = "unset";
    menu.style.left = mouse.cartesian.x + "px";
    menu.style.top = mouse.cartesian.y + "px";

    let optionList = Object.getOwnPropertyNames(options);
    for (var i = 0; i < optionList.length; i++) {
        var option = document.createElement("div");
        option.className = "option"
        option.id = "option" + i
        let callback = options[optionList[i]].apply(realObject);
        if (callback !== null) {
            let callback_function = function () {
                callback.apply(realObject);
                closeMenu();
                return false;
            };
            // console.log("Callback: " , callback, ' object: ' , realObject)
            option.onclick = callback_function;
            var node = document.createTextNode(optionList[i]);
            option.appendChild(node);
            menu.appendChild(option)
        }
    }
    var cancel = document.createElement("div");
    cancel.className = "option"
    cancel.id = "option" + i
    let cancel_function = function () {
        closeMenu();
        return false;
    };
    cancel.onclick = cancel_function;
    var cancel_node = document.createTextNode('Cancel');
    cancel.appendChild(cancel_node);
    menu.appendChild(cancel)
}

function closeMenu() {
    let menu = document.getElementById("menu");
    menu.style.display = "none";
}

function showTextEditor(realObject) {
    let editorPanel = document.getElementById("editorpanel");
    editorPanel.innerHTML = '';
    editorPanel.style.display = "flex";
    var titlePanel = document.createElement("div");
    titlePanel.className = "title"
    titlePanel.appendChild(document.createTextNode("Edit: " + realObject.name + " object"));
    var buttonPanel = document.createElement("div");
    buttonPanel.className = "interface topright buttonpanel"
    buttonPanel.appendChild(createButton("bluebutton", "\uD83D\uDCBE", function () {
        let newtext = document.getElementById("texteditor").value;
        // console.log("Save code:", newCode);
        realObject.editFromText(newtext);
        return false;
    }));
    buttonPanel.appendChild(createButton("redbutton", "\u2718", function () {
        closeTextEditor()
        return false;
    }));
    titlePanel.appendChild(buttonPanel)
    editorPanel.appendChild(titlePanel)
    var textarea = document.createElement("textarea");
    textarea.id = "texteditor";
    let editabletext = realObject.editableText();
    // console.log("Editable text:" + editabletext, editabletext)
    textarea.appendChild(document.createTextNode(editabletext));
    editorPanel.appendChild(textarea)
}

function createButton(class_string, text, onclick) {
    var button = document.createElement("div");
    button.className = "interfacebutton " + class_string
    button.onclick = onclick;
    button.appendChild(document.createTextNode(text));
    return button;
}

function closeTextEditor() {
    let editorPanel = document.getElementById("editorpanel");
    editorPanel.style.display = "none";
}

// export default Exported;
module.exports = {closeTextEditor,
    showTextEditor,
    closeMenu,
    showMenu,
    allInterfacesClosed,
    onMouseMove,
    onClick,
    onRender,
    setInterfaceText};