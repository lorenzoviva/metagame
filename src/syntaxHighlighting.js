var highlighters = [];

class SyntaxHighlighter {
    constructor(){

    }
    mapText(text){
        return text.replaceAll("\n\n", "\n");
    }
    getNewLine(){
        var line = document.createElement("div");
        line.appendChild(document.createElement("br"));
        return line;
    }
    getLines() {

    }
    setText(text) {

    }
    static is(object){

    }
    static formatText(text){
        return text.replaceAll("\n","").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replaceAll(" ", "&nbsp");
    }

}



class JavascriptSyntaxHighlighter extends SyntaxHighlighter{
    javascriptTokenFormatters = [
        class KeywordFormatter{
            static is(token){
                return token?.type?.keyword
            }
            static format(token, element){
                element.className += "javascript keyword " + token.type.keyword
            }
        },
        class NameFormatter{
            static is(token){
                return token?.type?.label === "name"
            }
            static format(token, element){
                element.className += "javascript name"
            }
        },
        class CommentFormatter{
            static is(token){
                return token?.type === "Line" || token?.type === "Block"
            }
            static format(token, element){
                element.className += "javascript comment"
            }
        },
        class StringFormatter{
            static is(token){
                return token?.type?.label === "string"
            }
            static format(token, element){
                element.className += "javascript string"
            }
        },
        class StringFormatter{
            static is(token){
                return token?.type?.label === "num"
            }
            static format(token, element){
                element.className += "javascript number"
            }
        }
    ]
    constructor(object3D) {
        super();
        this.object3D = object3D;
        this.node = object3D.object;
        this.setText(object3D.editableText());
        // this.code = object3D.editableText()
        // this.tokens = deployer.classes.Code.getTokens(this.code);
    }

    setText(text){
        this.code = text;
        this.tokens = [];
        this.tokens = deployer.classes.Code.getTokens(this.code);
    }

    getLines() {
        let index = 0;
        let lines = [];
        for (var lineText of this.code.split("\n")) {
            var lineTokens = this.tokens.filter(
                function(token){return token.start >= index && token.end <= index + lineText.length + 1}
            );
            // console.log("LINETEXT: ", lineText, " cropped: ", this.code.substr(index, lineText.length)   )
            let line = this.createLine(lineText, lineTokens, index);
            lines.push(line);
            index += lineText.length+1;
        }
        return lines
    }
    createLine(lineText, lineTokens, start){
        // console.log("text: ", lineText, " tokens:", lineTokens)

        if(lineText === ""){
            return this.getNewLine();
        }
        var line = document.createElement("div");
        var splittedTexts = []
        var splitIndex = 0;
        for (var token of lineTokens){
            splittedTexts.push(JavascriptSyntaxHighlighter.formatText(lineText.substr(splitIndex,token.start - start  - splitIndex)));
            // console.log(lineText, token, lineText.substr(splitIndex ,token.start - start  - splitIndex))
            splitIndex = token.start - start;
            var tokenspan = document.createElement("span");
            for (var javascriptTokenFormatter of this.javascriptTokenFormatters){
                if(javascriptTokenFormatter.is(token))javascriptTokenFormatter.format(token, tokenspan);
            }
            tokenspan.innerHTML = JavascriptSyntaxHighlighter.formatText(lineText.substr(token.start - start ,token.end - token.start))
            splittedTexts.push(tokenspan);
            splitIndex = token.end - start;

        }
        splittedTexts.push(JavascriptSyntaxHighlighter.formatText(lineText.substr(splitIndex,lineText.length - splitIndex)))
        // console.log("splittedText:", splittedTexts)

        for(var splittedText of splittedTexts){
            if(typeof splittedText === "string"){
                line.innerHTML += splittedText;
            }else{
                line.appendChild(splittedText);
            }
        }
        // console.log("lineText: ", lineText)
        return line;
    }

    static is(object){
        return object instanceof deployer.classes.Code;
    }
    // static formatText(text){
    //     return text.replaceAll(" ", "&nbsp").replaceAll("\n"," ")
    // }
}
highlighters.push(JavascriptSyntaxHighlighter)

class JSONSyntaxHighlighter extends SyntaxHighlighter {
    constructor(object3D) {
        super();
        this.object3D = object3D;
        this.json = object3D.editableText();
    }
    static is(object){
        return (object !== null && object !== undefined) && (object.constructor.name === Object.name || object.constructor.toString().indexOf('[native code]') === -1);
    }
    getLines() {
        let index = 0;
        let lines = [];
        var tokens = this.getTokens();
        for (var lineText of this.json.split("\n")) {
            var lineTokens = tokens.filter(
                function (token) {
                    return token.start >= index && token.end <= index + lineText.length + 1
                }
            );
            // let line = document.createElement("div");
            let line = this.createLine(lineText, lineTokens, index);
            lines.push(line);
            index += lineText.length+1;
            // console.log("linetext:", lineText, "lineTokens:", lineTokens)
        }
        return lines
    }
    setText(text){
        this.json = text;
    }
    getTokens(){
        var tokens = [];
        var iterator = this.json.matchAll(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g);
        var match = iterator.next();
        while (!match.done){
            // console.log("match: ", match)
            var token = {key: false, cls:'json number', start: match.value.index, end: match.value.index + match.value[0].length};
            if (/^"/.test(match.value[0])) {
                if (/:$/.test(match.value[0])) {
                    token.cls = 'json key';
                    token.key = true;
                } else {
                    token.cls = 'json string';
                }
            } else if (/true|false/.test(match.value[0])) {
                token.cls = 'json boolean';
            } else if (/null/.test(match.value[0])) {
                token.cls = 'json null';
            }
            tokens.push(token)
            match = iterator.next();
        }
        return tokens;
    }
    createLine(lineText, lineTokens, start){
        // console.log("text: ", lineText, " tokens:", lineTokens)

        if(lineText === ""){
            return this.getNewLine();
        }
        // console.log("text: ", lineText, " tokens:", lineTokens)

        var line = document.createElement("div");
        var splittedTexts = []
        var splitIndex = 0;
        for (var token of lineTokens){
            splittedTexts.push(JSONSyntaxHighlighter.formatText(lineText.substr(splitIndex,token.start - start  - splitIndex)));
            // console.log(lineText, token, lineText.substr(splitIndex ,token.start - start  - splitIndex))
            splitIndex = token.start - start;
            var tokenspan = document.createElement("span");
            tokenspan.className = token.cls;
            tokenspan.innerHTML = JSONSyntaxHighlighter.formatText(lineText.substr(token.start - start ,token.end - token.start))
            splittedTexts.push(tokenspan);
            splitIndex = token.end - start;

        }
        splittedTexts.push(JSONSyntaxHighlighter.formatText(lineText.substr(splitIndex,lineText.length - splitIndex)))
        // console.log("splittedText:", splittedTexts)

        for(var splittedText of splittedTexts){
            if(typeof splittedText === "string"){
                line.innerHTML += splittedText;
            }else{
                line.appendChild(splittedText);
            }
        }
        // console.log("lineText: ", lineText)
        return line;
    }
}

highlighters.push(JSONSyntaxHighlighter)

class DefaultHighlighter extends SyntaxHighlighter {
    constructor(object3D) {
        super();
        this.object3D = object3D;
        this.text = object3D.editableText();
    }
    static is(object){
        return true;
    }
    getLines() {
        let lines = [];
        for (var lineText of this.text.split("\n")) {
            let line = this.createLine(lineText);
            lines.push(line);
            // console.log("linetext:", lineText, "lineTokens:", lineTokens)
        }
        return lines
    }
    setText(text){
        this.text = text;
    }

    createLine(lineText){
        // console.log("text: ", lineText, " tokens:", lineTokens)
        if(lineText === ""){
            return this.getNewLine();
        }
        // console.log("text: ", lineText, " tokens:", lineTokens)
        var line = document.createElement("div");
        line.innerHTML = lineText;
        return line;
    }
}
highlighters.push(DefaultHighlighter)


class SyntaxHighlighterFactory{
    static create(object3D) {
        for(var highlighter of highlighters){
            if(highlighter.is(object3D.object)){
                console.log("highlighter", highlighter, highlighters)
                return new highlighter(object3D)
            }
        }
    }


}
module.exports = SyntaxHighlighterFactory