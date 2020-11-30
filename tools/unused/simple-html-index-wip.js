const fromString = require('./streams/from2-string')

import htm from 'htm';
import vhtml from 'vhtml';
const html = htm.bind(vhtml);

console.log(
  html`
    <xml>
      <item ref="..">
        etc
      </item>
    </xml>
  `
)

const favicon = '<link rel="shortcut icon"type="image/x-icon"' +
  ' href="data:image/x-icon;,">'

module.exports = createHtml


let template = 
`
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<title>${opt.title || ""}</title>
<meta charset="utf-8">
</head>
<body>
<script src="${opt.entry }></script>
</body>,
</html>
`

function createHtml (opt) {
  opt = opt || {}
  return fromString([
    '<!DOCTYPE html>',
    '<html lang="' + (opt.lang || `en`) + '" dir="' + (opt.dir || 'ltr') + '">',
    '<head>',
    opt.title ? ('<title>' + opt.title + '</title>') : '',
    '<meta charset="utf-8">',
    opt.base ? ('<base href="' + opt.base + '">') : '',
    opt.css ? ('<link rel="stylesheet" href="' + opt.css + '">') : '',
    opt.favicon ? favicon : '',
    '</head><body>',
    opt.entry ? ('<script src="' + opt.entry + '"></script>') : '',
    '</body>',
    '</html>'
  ].join(''));
}
