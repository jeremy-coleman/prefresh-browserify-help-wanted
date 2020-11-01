
console.log(require('fs').readdirSync(require("path").posix.normalize(process.cwd() + "/node_modules")).length)