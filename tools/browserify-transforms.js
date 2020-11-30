const hmr = require("./livereload/plugin-no-sourcemap")
const {tsxify} = require('./transforms/tsxify')
const {lessify} = require("./transforms/lessify")

module.exports = {
    hmr,
    lessify,
    tsxify
}