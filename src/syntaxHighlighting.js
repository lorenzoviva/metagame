var highlighters = [];


class JavascriptSyntaxHighlighter{
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
        this.object3D = object3D;
        this.node = object3D.object;
        this.setText(object3D.editableText());
        // this.code = object3D.editableText()
        // this.tokens = deployer.classes.Code.getTokens(this.code);
    }
    mapText(text){
        return text.replaceAll("\n\n", "\n");
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
    getNewLine(){
        var line = document.createElement("div");
        line.appendChild(document.createElement("br"));
        return line;
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
    static formatText(text){
        return text.replaceAll(" ", "&nbsp").replaceAll("\n"," ")
    }
    static is(object){
        return object instanceof deployer.classes.Code;
    }
}
highlighters.push(JavascriptSyntaxHighlighter)

class JSONSyntaxHighlighter{
    constructor(object3D) {
        this.object3D = object3D;
        this.text = object3D.editableText();
    }
    static is(object){
        return (object !== null && object !== undefined) && (object.constructor.name !== Object.name || object.constructor.toString().indexOf('[native code]') === -1);
    }
    // getLines() {
    //     let index = 0;
    //     let lines = [];
    //     for (var lineText of this.text.split("\n")) {
    //         var lineTokens = Object.getOwnPropertyNames()lineText
    //         console.log("LINETEXT: ", lineText, " cropped: ", this.code.substr(index, lineText.length) )
    //         let line = this.createLine(lineText, lineTokens, index);
    //         lines.push(line);
    //         index += lineText.length+1;
    //     }
    //     return lines
    // }
    // createLine(lineText, lineTokens, start){
    //     console.log("text: ", lineText, " tokens:", lineTokens)
    //
    //     var line = document.createElement("div");
    //     var splittedTexts = []
    //     var splitIndex = 0;
    //     for (var token of lineTokens){
    //         splittedTexts.push(JavascriptSyntaxHighlighter.formatText(lineText.substr(splitIndex,token.start - start  - splitIndex)));
    //         console.log(lineText, token, lineText.substr(splitIndex ,token.start - start  - splitIndex))
    //         splitIndex = token.start - start;
    //         var tokenspan = document.createElement("span");
    //         for (var javascriptTokenFormatter of this.javascriptTokenFormatters){
    //             if(javascriptTokenFormatter.is(token))javascriptTokenFormatter.format(token, tokenspan);
    //         }
    //         tokenspan.innerHTML = JavascriptSyntaxHighlighter.formatText(lineText.substr(token.start - start ,token.end - token.start))
    //         splittedTexts.push(tokenspan);
    //         splitIndex = token.end - start;
    //
    //     }
    //     splittedTexts.push(JavascriptSyntaxHighlighter.formatText(lineText.substr(splitIndex,lineText.length - splitIndex)))
    //     // console.log("splittedText:", splittedTexts)
    //
    //     for(var splittedText of splittedTexts){
    //         if(typeof splittedText === "string"){
    //             line.innerHTML += splittedText;
    //         }else{
    //             line.appendChild(splittedText);
    //         }
    //     }
    //
    //     // console.log("lineText: ", lineText)
    //     return line;
    // }
}
highlighters.push(JSONSyntaxHighlighter)


class SyntaxHighlighterFactory{
    static create(object3D) {
        for(var highlighter of highlighters){
            if(highlighter.is(object3D.object)){
                return new highlighter(object3D)
            }
        }
    }


}
module.exports = SyntaxHighlighterFactory