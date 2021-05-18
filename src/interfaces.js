const clientserver = require('./clientserver.js');
var classes = require('./metaobjects.js');

function setInterfaceText(identifier, newText){
    document.getElementById(identifier).innerText = newText;
}

function allInterfacesClosed(){
    let menu = document.getElementById("menu");
    let editorpanel = document.getElementById("editorpanel");
    return menu.style.display !== 'unset' && editorpanel.style.display !== 'flex';
}
function interfaceMouseMove(mouse) {
    let menu = document.getElementById("menu");
    // console.log("CONDITION:" + menu.style.display + " ", mouse.cartesian.x , menu.style.left.replace('px',''), mouse.cartesian.x > menu.style.left.replace('px','') + menu.offsetWidth,  mouse.cartesian.y, menu.style.top.replace('px',''))
    let left = Number(menu.style.left.replace('px', ''));
    let top = Number(menu.style.top.replace('px', ''));
    if (menu.style.display === 'unset' &&
        (mouse.cartesian.x < left - 10 || mouse.cartesian.x > left + menu.offsetWidth + 10 ||
            mouse.cartesian.y < top - 10 || mouse.cartesian.y > top + menu.offsetHeight + 10)) {
        closeMenu();

    }
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
module.exports = {closeTextEditor:closeTextEditor,
    showTextEditor:showTextEditor,
    closeMenu:closeMenu,
    showMenu: showMenu,
    interfaceMouseMove: interfaceMouseMove,
    allInterfacesClosed:allInterfacesClosed,
    setInterfaceText:setInterfaceText};