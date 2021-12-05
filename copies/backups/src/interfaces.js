const clientserver = require('./clientserver.js');
var classes = require('./metaobjects.js');
var SyntaxHighlighterFactory = require('./syntaxHighlighting.js');


class MenuManager {
    constructor() {
        this.menus = {}

    }
    showMenu(mouse, title, options) {
        this.title = title;
        this.options = options;
        this.realObject = null;
        this.setupFirstMenu();
        this.createMenu([],  mouse.cartesian.x,  mouse.cartesian.y);
        // console.log("this.menus: ",this.menus)
    }
    showObjectMenu(mouse, realObject) {
        this.title = realObject.common_name
        this.realObject = realObject;
        this.options = realObject.actions;
        this.setupFirstMenu();
        this.createMenu([],  mouse.cartesian.x,  mouse.cartesian.y);
        // console.log("this.menus: ",this.menus)
    }
    setupFirstMenu(){
        this.menus = {}
        this.menus._title = this.title;
        let optionList = Object.getOwnPropertyNames(this.options);
        for (var i = 0; i < optionList.length; i++) {
            let callback = this.options[optionList[i]].apply(this.realObject);
            if(callback === null) continue;
            var splittedOption = optionList[i].split(">");
            var analyzedMenu = this.menus;
            for(var l = 0; l < splittedOption.length; l++){
                analyzedMenu[splittedOption[l]] = {...analyzedMenu[splittedOption[l]], ...{_title:splittedOption[l]}}
                if(l === splittedOption.length-1){
                    analyzedMenu[splittedOption[l]].callback = callback;
                }
                analyzedMenu = analyzedMenu[splittedOption[l]];
            }
        }
    }
    navigateMenu(event) {
        let onhover = event.target.onhover;
        if(onhover){
            // console.log("X: ", this.current_menu.style.left.replace("px","") + this.current_menu.clientWidth,"Y",this.current_menu.style.top.replace("px","") + event.target.clientWidth )
            onhover(event);
            // console.log(this.current_menu)
        }
    }
    createMenu(paths, x,y){
        var menus = this.menus;
        if(paths.length > 0){
            this.closeOtherPaths(paths.slice(0, paths.length-1));
            for (var path of paths){
                menus = menus[path];
            }
        }

        var menu = document.createElement("div");
        menu.className = "interface menu";
        menu.id = "menu" + menus._title
        var title_element = document.createTextNode(menus._title);
        menu.appendChild(title_element);
        // console.log("X, Y: ", x, y)
        menu.style.left = (x > 0 ? x : 0)  + "px";
        menu.style.top = (y > 0 ? y : 0) + "px";
        document.body.appendChild(menu)
        var title_height = document.createRange();//
        title_height.selectNodeContents(title_element);
        var title_bound = title_height.getBoundingClientRect();
        title_height = title_bound.height;
        var optionList = Object.getOwnPropertyNames(menus).filter(function(opt) {return !opt.startsWith("_")});
        for (var i = 0; i < optionList.length; i++) {
            var option = document.createElement("div");
            option.className = "option"
            option.index = i;
            let current_option = optionList[i];
            let callback = menus[current_option];
            let action_callback = callback.callback;
            let that = this;
            if (action_callback !== undefined) {
                let onclick_callback = function () {
                    action_callback.apply(that.realObject);
                    that.closeMenu();
                    return false;
                };
                option.onclick = onclick_callback;
                let onhover_callback = function (event) {
                    that.closeOtherPaths(paths);
                }
                option.onhover = onhover_callback;

            }else{
                let onhover_callback = function (event) {
                    // console.log("################ event: ", event.target.clientHeight*event.target.index , title_height )
                    let menu_x = Number.parseInt(menu.style.left.replace("px","")) + menu.clientWidth;
                    let menu_y = Number.parseInt(menu.style.top.replace("px","")) + title_height + event.target.clientHeight*(event.target.index);
                    that.createMenu(paths.concat([current_option]), menu_x, menu_y);
                };
                option.onhover = onhover_callback;
                // console.log("HOVER Callback: " , onhover_callback, ' object: ' , this.realObject)
            }

            // console.log("Callback: " , action_callback, ' object: ' , this.realObject)

            let node = document.createTextNode(current_option);
            option.appendChild(node);
            menu.appendChild(option);
            option.id = "option" + current_option

        }
        if(paths.length > 0){
            let bound = menu.getBoundingClientRect();
            // console.log(bound , title_bound, optionList)
            // console.log("Menu offset: ", (bound.height / 2))
            var new_y =  (bound.top - (bound.height / 2));
            menu.style.top = (new_y > 0 ? new_y : 0) +"px";// - ((bound.height - title_height)/2 ))+"px";
            // console.log((bound.top - title_height - ((bound.height - title_height)/2 ))+"px", menu.style.top, title_height)

        }
        menu.appendChild(this.createCancelOption())
        menus._node = menu;
        this.mabyeMoveMenus(menu)
        return menu;
    }
    mabyeMoveMenus(menu){
        var bottom = Number.parseInt(menu.style.top.replace("px","")) + menu.clientHeight;
        var right = Number.parseInt(menu.style.left.replace("px","")) + menu.clientWidth;
        if(bottom > window.innerHeight){
            this.moveMenus(0,window.innerHeight - bottom - 10);
        }
        if(right > window.innerWidth){
            this.moveMenus(window.innerWidth - right - 10, 0);
        }
    }
    moveMenus(x, y, menus = this.menus){
        var menu = menus._node;
        if(menu){
            let style = menu.style;
            // console.log("BEFORE: ",menus._node.style.cssText)
            style.top = (Number.parseInt(style.top.replace("px","")) + y) + "px";
            style.left = (Number.parseInt(style.left.replace("px","")) + x) + "px";
            menus._node.style.cssText = style.cssText;
            // console.log("AFTER: ", menus._node.style.cssText)
            menus._node.style.display='none';
            menus._node.offsetHeight; // no need to store this anywhere, the reference is enough
            menus._node.style.display='';
            var optionList = Object.getOwnPropertyNames(menus).filter(function(opt) {return !opt.startsWith("_")});
            // console.log("Moved: ", menu, " (", x, y, ")", " --> ", optionList)
            for(var sub_menus of optionList){
                this.moveMenus(x, y, menus[sub_menus]);
            }

        }
    }
    closeMenu() {
        do {
            var open_menus = document.getElementsByClassName("interface menu");
            for (var menu of open_menus) {
                document.body.removeChild(menu);
            }
        }  while(open_menus.length > 0);
    }
    closeOtherPaths(paths){
        var menus = this.menus;
        if(paths.length > 0){
            for (var path of paths){
                menus = menus[path];
            }
        }
        var optionList = Object.getOwnPropertyNames(menus).filter(function(opt) {return !opt.startsWith("_")});
        for (var i = 0; i < optionList.length; i++) {
            if(menus[optionList[i]]._node !== null && menus[optionList[i]]._node !== undefined){
                // console.log("Removing : ", menus[optionList[i]]._node, "from path: ", paths , optionList[i])
                document.body.removeChild(menus[optionList[i]]._node);
                delete menus[optionList[i]]._node;
            }
        }
    }

    createCancelOption(){
        var cancel = document.createElement("div");
        cancel.className = "option"
        cancel.id = "optionCancel"
        var that = this;
        let cancel_function = function () {
            that.closeMenu();
            return false;
        };
        cancel.onclick = cancel_function;
        var cancel_node = document.createTextNode('Cancel');
        cancel.appendChild(cancel_node);
        return cancel;
    }
}


const raycaster = new THREE.Raycaster()
const mouse = {polar: new THREE.Vector2(), cartesian: new THREE.Vector2(), event:"none"};
var menuManager = new MenuManager();
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
    let open_menus = document.getElementsByClassName("interface menu");
    let close = true;
    for(var menu of open_menus){
        let left = Number(menu.style.left.replace('px', ''));
        let top = Number(menu.style.top.replace('px', ''));
        if (!(mouse.cartesian.x < left - 10 || mouse.cartesian.x > left + menu.offsetWidth + 10 ||
                mouse.cartesian.y < top - 10 || mouse.cartesian.y > top + menu.offsetHeight + 10)) {
            close = false;
        }
    }
    if(close) {
        menuManager.closeMenu();
    }else {
        menuManager.navigateMenu(event);
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

// function showAddObjectMenu(){
//     // console.log("showAddObjectMenu")
//     mouse.cartesian.x = 0; //document.querySelector("#addobject").offsetWidth;
//     mouse.cartesian.y = document.querySelector("#addobject").offsetHeight;
//     var objects = Object.getOwnPropertyNames(deployer.objects);
//     var options = {}
//     for(var clas of Object.getOwnPropertyNames(classes)){
//         let oclass = clas;
//         for(var object_name of objects){
//             var object3D = deployer.objects[object_name]
//             console.log("class: ", oclass, " object: ", object3D)
//             if(object3D instanceof classes[oclass]){
//                 console.log("isinstanceof")
//                 options[clas + ">" + object3D.name] = function (){
//                     return function(){
//                         var block = new classes[oclass](object3D.object);
//                         // var block = new classes[oclass]();
//                         // block.setObject(object3D.object);
//                         // block.redraw(object3D.object, block.parent, block.identifier)
//                         // block.setMesh(object3D.mesh);
//
//                         console.log("Created block: ", oclass, classes[oclass], block);
//                         block.put(scene);
//                     }
//                 }
//             }
//         }
//     }
//     menuManager.showMenu(mouse, "Add object", options)
//     // menuManager.showMenu(mouse, "Add object", {"test": function (){ return function(){ console.log("HELLO")}}})
// }
function showAddObjectMenu(){
    // console.log("showAddObjectMenu")
    mouse.cartesian.x = 0; //document.querySelector("#addobject").offsetWidth;
    mouse.cartesian.y = document.querySelector("#addobject").offsetHeight;
    var objects = Object.getOwnPropertyNames(deployer.objects);
    var options = {}
    for(var clas of Object.getOwnPropertyNames(classes)){
        let oclass = clas;
        for(var object_name of objects){
            var object3D = deployer.objects[object_name]
            if(object3D instanceof classes[oclass]) {
                options[clas + ">" + object3D.name] = function (name) {
                    return function () {
                        return function () {
                            deployer.importObject(deployer.objects[name].object, new THREE.Vector3(0,0,0))
                        }
                    }
                }(object_name)
            }
        }
    }
    menuManager.showMenu(mouse, "Add object", options)
    // menuManager.showMenu(mouse, "Add object", {"test": function (){ return function(){ console.log("HELLO")}}})
}

function onLeftClick(mouse){
    // STOP MOVING OBJECTS
    deployer.grid && deployer.grid.onLeftClick();
    //OPEN MENU
    var object3DList = getInterceptingObjectList();
    if(allInterfacesClosed() && (deployer.grid === undefined || deployer.grid.object.active === false) && object3DList.length > 0){
        menuManager.showObjectMenu(mouse, object3DList[0])
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
        return deployer.grid === undefined || element !== deployer.grid.mesh;
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
    let menu = document.getElementsByClassName("interface menu");
    let editorpanel = document.getElementById("editorpanel");
    return menu.length === 0 && editorpanel.style.display !== 'flex';
}


class TextEditor{
    constructor(object3D) {
        this.textarea = document.createElement("div");
        this.textarea.id = "texteditor";
        this.textarea.type= "textarea";
        this.textarea.contentEditable = "true";
        this.syntaxHighlighter = SyntaxHighlighterFactory.create(object3D);
        this.draw();
        var that = this;
        // REDRAWS EVERY INPUT (may be expensive for large code documents)
        this.textarea.addEventListener("input", function(event) {
            // console.log("Before changed text: ", that.syntaxHighlighter.mapText(that.textarea.innerText))
            // console.log("Textarea edited:", event)
            that.syntaxHighlighter.setText(that.syntaxHighlighter.mapText(that.textarea.innerText))
            that.redraw();
            // console.log("After changed text: ", that.syntaxHighlighter.mapText(that.textarea.innerText).substr(0,caret))
            // console.log("input event fired", caret);
        }, false);
        // console.log("LINES:", lines)
        // console.log("syntaxHighlighter", this.syntaxHighlighter)
        // console.log("Editable text:" + editabletext, editabletext)

    }
    redraw(){
        let caret = this.getCaret();
        let lines = this.syntaxHighlighter.getLines();
        this.textarea.innerHTML = ''
        for (var lineIndex = 0; lineIndex < lines.length; lineIndex++){
            // console.log("redrawing: ", lines[lineIndex].outerHTML, "to" , lineNodes[lineIndex].outerHTML );
            // lineNodes[lineIndex].outerHTML = lines[lineIndex].outerHTML;
            this.textarea.appendChild(lines[lineIndex]);

        }
        if(caret.startLine >= 0 && caret.startOffset >= 0) this.setCaretPosition(lines[caret.startLine],caret.startOffset)
        // if(caret.line && caret.position >= 0) this.setCaretPosition(lines[caret.line],caret.position)
    }
    getCaret(){
        var selection = window.getSelection();
        var mapFunction = this.syntaxHighlighter.mapText;
        function getPreviousLines(node, jump=false){
            var lines = jump?"":mapFunction(node.innerText || node.textContent);
            // console.log("Node: ", node, node.parentNode, node.previousSibling, lines)
            if(!jump && node.parentNode.id === "texteditor" && !lines.includes("\n")) lines += "\n";
            if(node.previousSibling) return  getPreviousLines(node.previousSibling) + lines;
            if(node.parentNode.id !== "texteditor") return getPreviousLines(node.parentNode, true) + lines;
            return lines;
        }
        let startNodePreText = getPreviousLines(selection.anchorNode, true);
        let endNodePreText = getPreviousLines(selection.focusNode, true);

        let startLineSplit = startNodePreText.split("\n");
        let endLineSplit = endNodePreText.split("\n");

        var caret = {}

        caret.startLine = startLineSplit.length - 1;
        caret.endLine = endLineSplit.length - 1;

        caret.startOffset = startLineSplit[caret.startLine].length + selection.anchorOffset
        caret.endOffset = startLineSplit[caret.startLine].length + selection.focusOffset

        return caret

    }
    draw(){
        this.textarea.innerHTML = ''
        let lines =  this.syntaxHighlighter.getLines();
        for( var line of lines ){
            this.textarea.appendChild(line)
        }
    }
    getNode(){
        return this.textarea;
    }
    getText(){
        return this.textarea.innerText;
    }
    setCaretPosition(element, position) {
        var range = document.createRange()
        var sel = window.getSelection()
        // console.log(document.getElementById("texteditor").innerText);
        // console.log("elementOffset", elementOffset)
        try {
            var elementOffset = TextEditor.getNodeAt(element, position);
            range.setStart(elementOffset.node, elementOffset.position)
        }catch (error){
            console.log("ERROR setCaretPosition: ", error,element, position, "  -->  " , element.nextSibling || element.parent.nextSibling, position - (element.innerText || element.textContent).length)
            return this.setCaretPosition(element.nextSibling || element.parent.nextSibling, position - (element.innerText || element.textContent).length)
        }
        range.collapse(true)

        sel.removeAllRanges()
        sel.addRange(range)
    }
    static getNodeAt(node, position){
        let sum = 0;
        for (var childNode of node.childNodes){
            let line = childNode.innerText?childNode.innerText:childNode.textContent
            let lineLength = line.length;
            // if(line === "\n"){
            //     console.log("#SUM:" , sum, "pos:", position, "text", line, "linelenght: ", lineLength)
            // }else
            if(lineLength + sum < position){
                sum += lineLength;
                // console.log("SUM:" , sum, "pos:", position, "text", line, "linelenght: ", lineLength)
            }else{
                // console.log("FINAL SUM:" , sum, "pos:", position, "text",  line, "childs: ",  childNode.childNodes.length)
                if(childNode.childNodes.length > 0){
                    return TextEditor.getNodeAt(childNode, position - sum);
                }else{
                    return {node: childNode, position: position - sum}
                }
            }
        }
        return {node: node, position: position}
    }
}
window.textarea = null;
function showTextEditor(object3D) {
    let editorPanel = document.getElementById("editorpanel");
    editorPanel.innerHTML = '';
    editorPanel.style.display = "flex";
    var titlePanel = document.createElement("div");
    titlePanel.className = "title"
    titlePanel.appendChild(document.createTextNode("Edit: " + object3D.name + " object"));
    var buttonPanel = document.createElement("div");
    buttonPanel.className = "interface topright buttonpanel"
    window.textarea = new TextEditor(object3D);
    // var textarea = new TextEditor(object3D);
    buttonPanel.appendChild(createButton("bluebutton", "\uD83D\uDCBE", function () {
        let newtext = window.textarea.getText();
        // let newtext = textarea.getText();
        // let newtext = document.getElementById("texteditor").innerText;
        // console.log("Save code:", newCode);
        object3D.editFromText(newtext);
        return false;
    }));
    buttonPanel.appendChild(createButton("redbutton", "\u2718", function () {
        closeTextEditor()
        return false;
    }));
    titlePanel.appendChild(buttonPanel)
    editorPanel.appendChild(titlePanel)
    editorPanel.appendChild(textarea.getNode())
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
    closeMenu:menuManager.closeMenu,
    showMenu:menuManager.showObjectMenu,
    showAddObjectMenu,
    allInterfacesClosed,
    onMouseMove,
    onClick,
    onRender,
    setInterfaceText,
    createMenu:menuManager.createMenu,
    mouse,
    menuManager};