var path = require("path");
var cp = require("child_process");

let page = path.resolve("build/app.html");

//works on windows
try {
  cp.exec("start chrome " + page);
} catch (e) {
  console.log(e);
}
