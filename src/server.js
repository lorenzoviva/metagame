const https = require('https');
const fs = require('fs');
var path = require('path');

const options = {
    key: fs.readFileSync('cert/key.pem'),
    cert: fs.readFileSync('cert/cert.pem')
};
let basepath = __dirname.replace("src","");

https.createServer(options, function (req, res) {
    if(req.url === "/"){
        fs.readFile("./index.html", "UTF-8", function(err, html){
            res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
            res.end(html);
        });
    }else{
        var requestPath = path.join(basepath, req.url);
        if (fs.existsSync(requestPath)) {
            var fileStream = fs.createReadStream(requestPath, "UTF-8");
            if(req.url.match("\.css$")){
                res.writeHead(200, {"Content-Type": "text/css; charset=utf-8"});
                fileStream.pipe(res);
            }else if(req.url.match("\.png$")){
                res.writeHead(200, {"Content-Type": "image/png; charset=utf-8"});
                fileStream.pipe(res);
            }else if(req.url.match("\.js$")){
                res.writeHead(200, {"Content-Type": "text/javascript; charset=utf-8"});
                fileStream.pipe(res);
            }else{
                res.writeHead(404, {"Content-Type": "text/html"});
                res.end("No Page Found");
            }
            console.log("Finished serving: " + req.url)
        }else {
            console.log("Could not serve: " + req.url);
            res.writeHead(404);
        }
    }
}).listen(8000);