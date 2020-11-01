require("sucrase/register")
const hmr = require("./livepreactload")
const {tsxify} = require('./tsxify')
const {lessify} = require("./lessify")

module.exports = {
    hmr,
    lessify,
    tsxify
}