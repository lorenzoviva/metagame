const clientserver = require('./clientserver.js');
var classes = require('./metaobjects.js');
var SyntaxHighlighterFactory = require('./syntaxHighlighting.js');
class MenuManager {
    constructor() {
        this.menus = {}

    }

    showMenu(mouse, realObject) {
        this.realObject = realObject;
        this.options = realObject.actions;
        this.setupFirstMenu();
        this.createMenu([],  mouse.cartesian.x,  mouse.cartesian.y);
        // console.log("this.menus: ",this.menus)
    }
    setupFirstMenu(){
        this.menus = {}
        this.menus._title = this.realObject.common_name;
        let optionList = Object.getOwnPropertyNames(this.options);
        for (var i = 0; i < optionList.length; i++) {
            let callback = this.options[optionList[i]].apply(this.realObject);
            if(callback === null)continue;
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
        menu.style.left = x + "px";
        menu.style.top = y + "px";
        document.body.appendChild(menu)
        var title_height = document.createRange();//
        title_height.selectNodeContents(title_element);
        title_height = title_height.getBoundingClientRect().height;

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
                    let menu_y = Number.parseInt(menu.style.top.replace("px","")) + title_height + event.target.clientHeight*event.target.index;
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

function onLeftClick(mouse){
    // STOP MOVING OBJECTS
    deployer.grid && deployer.grid.onLeftClick();
    //OPEN MENU
    var object3DList = getInterceptingObjectList();
    if(allInterfacesClosed() && (deployer.grid === undefined || deployer.grid.object.active === false) && object3DList.length > 0){
        menuManager.showMenu(mouse, object3DList[0])
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
        let lineNodes = this.textarea.childNodes;
        let lines = this.syntaxHighlighter.getLines();
        let setCaret = false;
        let caretElement = null;
        let caretPosition = 0;
        for (var lineIndex = 0; lineIndex < lineNodes.length; lineIndex++){
            if(!lineNodes[lineIndex].isEqualNode(lines[lineIndex])){
                // console.log("redrawing: ", lines[lineIndex].outerHTML, "to" , lineNodes[lineIndex].outerHTML );
                var caretRange = this.getCaretPosition(lineNodes[lineIndex])
                lineNodes[lineIndex].outerHTML = lines[lineIndex].outerHTML;
                if(caretRange > 0) {
                    // console.log("CARET RANGE", caretRange)
                    caretPosition = caretRange;
                    caretElement = lineNodes[lineIndex];
                    setCaret = true;
                }
            }
        }
        if(setCaret && caretElement && caretPosition > 0)this.setCaretPosition(caretElement,caretPosition)

        // console.log("redrawn: ", redrawn);
        return redrawn;
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

    getCaretPosition(element) {
        var caretOffset = 0;
        var doc = this.textarea.ownerDocument || this.textarea.document;
        var win = doc.defaultView || doc.parentWindow;
        var sel = win.getSelection();
        if (sel.rangeCount > 0) {
            var range = win.getSelection().getRangeAt(0);
            var preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            // console.log("range", range.endContainer, range.endContainer.previousSibling, range.endContainer.nextSibling, range.endContainer.parentNode, range.endContainer.lastChild)
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            caretOffset = preCaretRange.toString().length;
            // console.log("PRE-RANGE : ", preCaretRange, preCaretRange.startContainer, preCaretRange.endContainer," Offset: ", preCaretRange.startOffset, preCaretRange.endOffset)
            // console.log("RANGE : ", range, range.startContainer, range.endContainer," Offset: ", range.startOffset, range.endOffset)
        }
        return caretOffset;
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
function showTextEditor(object3D) {
    let editorPanel = document.getElementById("editorpanel");
    editorPanel.innerHTML = '';
    editorPanel.style.display = "flex";
    var titlePanel = document.createElement("div");
    titlePanel.className = "title"
    titlePanel.appendChild(document.createTextNode("Edit: " + object3D.name + " object"));
    var buttonPanel = document.createElement("div");
    buttonPanel.className = "interface topright buttonpanel"
    buttonPanel.appendChild(createButton("bluebutton", "\uD83D\uDCBE", function () {
        let newtext = document.getElementById("texteditor").innerText;
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
    var textarea = new TextEditor(object3D);
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
    showMenu:menuManager.showMenu,
    allInterfacesClosed,
    onMouseMove,
    onClick,
    onRender,
    setInterfaceText,
    createMenu:menuManager.createMenu,
    mouse,
    menuManager};