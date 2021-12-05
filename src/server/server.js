const https = require('https');
const fs = require('fs');
var path = require('path');

const options = {
    key: fs.readFileSync('cert/key.pem'),
    cert: fs.readFileSync('cert/cert.pem')
};
let basepath = __dirname.replace("src\\server","");
console.log("BASEPATH: ",basepath);
// let basepath = __dirname;



function get(req, res){
    var requestPath = path.join(basepath, req.url);
    console.log("GET: " + req.url, " -> " + requestPath);
    if (fs.existsSync(requestPath)) {
        var fileStream = fs.createReadStream(requestPath, "UTF-8");
        if (req.url.match("\.css$")) {
            res.writeHead(200, {"Content-Type": "text/css; charset=utf-8"});
            fileStream.pipe(res);
        } else if (req.url.match("\.png$")) {
            res.writeHead(200, {"Content-Type": "image/png; charset=utf-8"});
            fileStream.pipe(res);
        } else if (req.url.match("\.js$")) {
            res.writeHead(200, {"Content-Type": "text/javascript; charset=utf-8"});
            fileStream.pipe(res);
        } else {
            res.writeHead(404, {"Content-Type": "text/html"});
            res.end("No Page Found");
            console.log("Could not serve: " + req.url);
            return;
        }
        console.log("Successfully GET: " + req.url)
    } else {
        console.log("Could not GET: " + req.url);
        res.writeHead(404);
    }
}

function post(req, res){
    var requestPath = path.join(basepath, req.url);
    if (req.url.match("\.js$")) {
        var fileStream = fs.createWriteStream(requestPath, "UTF-8");
        req.pipe(fileStream);
    }else{
        res.writeHead(400, {"Content-Type": "text/html; charset=utf-8"});
        res.end("Bad request!");
    }
    var payload = ''
    req.on('data', function(data) {
        payload += data
    })
    req.on('end', function() {
        console.log('POST: ' + payload + '\n\t' + req.url)
        res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
        res.end(req.url + " saved!");
    })
    fileStream.on('error', function (err) {
        console.log(err);
    });
}
https.createServer(options, function (req, res) {
    if(req.url === "/" && req.method === "GET"){
        fs.readFile("./index.html", "UTF-8", function(err, html){
            res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
            res.end(html);
        });
    }else{
        if(req.method === "GET") {
            get(req, res)
        }else if(req.method === "POST"){
            post(req, res)
        }
    }
}).listen(8000);