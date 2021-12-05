const clientserver = require('../networking/clientserver.js');
var classes = require('../development/metaobjects.js');
var SyntaxHighlighterFactory = require('./syntaxHighlighting.js');


class MenuManager {
    constructor() {
        this.menus = {}
        window.mouseControls.register("mousedown", this.onMouseClickListener.bind(this));
        window.mouseControls.register("mousemove", this.onMouseMoveListener.bind(this));
    }
    // Close all menus or navigate to a specific menu
    onMouseMoveListener(event, mouse, raycaster) {
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
            this.closeMenu();
        }else {
            this.navigateMenu(event);
        }
    }
    // Opens context menu
    onMouseClickListener(event, mouse, raycaster) {
        var object3DList = mouseControls.getInterceptingObjectList();
        if(mouse.right) {
            if (allInterfacesClosed() && (deployer.grid === undefined || deployer.grid.isMovingObject() === false) && object3DList.length > 0) {
                this.showObjectMenu(mouse, object3DList[0])
            }
        }
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


var menuManager = new MenuManager();

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


function setInterfaceText(identifier, newText){
    document.getElementById(identifier).innerText = newText;
}

function allInterfacesClosed(){
    let menu = document.getElementsByClassName("interface menu");
    let editorpanel = document.getElementById("editorpanel");
    let dropdown = document.getElementById("dropmessage");
    return menu.length === 0 && editorpanel.style.display !== 'flex' && dropdown.style.display === 'none';
}

function onMouseInterceptObject3D(object3DList){
   updateContextLabel(object3DList);
}
function updateContextLabel(object3DList) {
    // SHOW CONTEXT (names top-left) AND RELATIONS (wiring)
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
    }
}
mouseControls.register("render", onMouseInterceptObject3D)
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
    // editorPanel.onmousedown = onMouseDownTextEditor;
    // editorPanel.ondragover = onDragTextEditor;
    var titlePanel = document.createElement("div");
    titlePanel.className = "title"
    titlePanel.id = "editorpaneltitle";
    titlePanel.appendChild(document.createTextNode("Edit: " + object3D.name + " object"));
    titlePanel.onmousedown = onMouseDownTextEditorTitle;
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
var textEditorResizeLastPosition = {l: null, r: null, t : null, b: null};
// on user drag border, resize the texteditor
function onMouseDownTextEditor(event){
    let editorPanel = document.getElementById("editorpanel");
    let panelRectangle = editorPanel.getBoundingClientRect()
    let dl = event.clientX - panelRectangle.left;
    let dr = event.clientX - panelRectangle.right;
    let dt = event.clientY - panelRectangle.top;
    let db = event.clientY - panelRectangle.bottom;
    if(dr < 5 && dr > -5) textEditorResizeLastPosition.l = event.clientX;
    if(dl < 5 && dl > -5) textEditorResizeLastPosition.r = event.clientX;
    if(dt < 5 && dt > -5) textEditorResizeLastPosition.t = event.clientY;
    if(db < 5 && db > -5) textEditorResizeLastPosition.b = event.clientY;
    textEditorResizeLastPosition.x = event.clientX;
    textEditorResizeLastPosition.y = event.clientY;

    window.addEventListener("mousemove", onMouseMoveTextEditor);
    var onmouseup =() => {
        // console.log("mouse up");
        window.removeEventListener("mousemove", onMouseMoveTextEditor );
        window.removeEventListener("mouseup", onmouseup );
        textEditorDragLastPosition = {l: null, r: null, t : null, b: null};
    }
    window.addEventListener("mouseup", onmouseup);
    return false;
}
// todo: make this work
// on user drag border, resize the texteditor
function onMouseMoveTextEditor(event){
    let editorPanel = document.getElementById("editorpanel");
    let panelRectangle = editorPanel.getBoundingClientRect()
    let newWidth =  editorPanel.style.width ? Number.parseFloat(editorPanel.style.width.replace("px", "")) : panelRectangle.width;
    let newHeight = editorPanel.style.height ? Number.parseFloat(editorPanel.style.height.replace("px", "")) :  panelRectangle.height ;
    console.log("RESIZE TEXT EDITOR", event.clientX, event.clientY, " W: ", newWidth, "+", event.clientX - panelRectangle.right, "H: ",newHeight ,"+", event.clientY - panelRectangle.bottom);
    let dx = event.clientX - panelRectangle.right;
    let dy = event.clientY - panelRectangle.bottom;
    if(dx < 5 && dx > -5 && dy < 5  && dy > -5 ){
        console.log("case xy" , dx, dy)
        newWidth = newWidth + dx;
        newHeight = newHeight + dy;
    }else if(dx < 5 && dx > -5){
        console.log("case x", dx);
        newWidth = newWidth + dx;
    }else if(dy < 5  && dy > -5) {
        console.log("case y", dy);
        newHeight = newHeight + dy;
    }
    console.log("newWidth:", newWidth, "newHeight:", newHeight);
    if(newWidth < 100){
        newWidth = 100;
    }
    if(newHeight < 100){
        newHeight = 100;
    }
    editorPanel.style.width = newWidth + "px";
    editorPanel.style.height = newHeight + "px";
    textEditorResizeLastPosition = {x: event.clientX, y: event.clientY};

    event.preventDefault();
    return true;
}
var textEditorDragLastPosition = {x: null, y: null};
function onMouseDownTextEditorTitle(event){
    textEditorDragLastPosition = {x: event.clientX, y: event.clientY};
    let titlePanel = document.getElementById("editorpaneltitle");
    console.log("mouse down");
    window.addEventListener("mousemove", onDragTextEditorTitle);
    var onmouseup =() => {
        // console.log("mouse up");
        window.removeEventListener("mousemove", onDragTextEditorTitle );
        window.removeEventListener("mouseup", onmouseup );
        textEditorDragLastPosition = {x: null, y: null};
    }
    window.addEventListener("mouseup", onmouseup);

}
// function to move the texteditor on user dragging title
function onDragTextEditorTitle(event){
    // console.log("onDragTextEditorTitle", event)
    let editorPanel = document.getElementById("editorpanel");
    let panelRectangle = editorPanel.getBoundingClientRect()
    let x = panelRectangle.left;
    let y = panelRectangle.top;
    let width = panelRectangle.width;
    let height = panelRectangle.height;
    let xmin = 0;
    let ymin = 0;
    let xmax = window.innerWidth - width;
    let ymax = window.innerHeight - height;
    let xmove = event.clientX - textEditorDragLastPosition.x;
    let ymove = event.clientY - textEditorDragLastPosition.y;
    let newx = x + xmove;
    let newy = y + ymove;
    if(newx < xmin){
        newx = xmin;
    }
    if(newx > xmax){
        newx = xmax;
    }
    if(newy < ymin){
        newy = ymin;
    }
    if(newy > ymax){
        newy = ymax;
    }
    editorPanel.style.left = newx + "px";
    editorPanel.style.top = newy + "px";
    textEditorDragLastPosition = {x: event.clientX, y: event.clientY};
    event.preventDefault();

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

function openDropdownMessage(message) {
    let dropdown = document.getElementById("dropmessage");
    dropdown.innerText = message;
    dropdown.style.display = "block";
}
function closeDropdownMessage() {
    let dropdown = document.getElementById("dropmessage");
    dropdown.style.display = "none";
}

module.exports = {closeTextEditor,
    showTextEditor,
    closeMenu:menuManager.closeMenu,
    showMenu:menuManager.showObjectMenu,
    showAddObjectMenu,
    allInterfacesClosed,
    setInterfaceText,
    openDropdownMessage,
    closeDropdownMessage,
    createMenu:menuManager.createMenu,
    menuManager};