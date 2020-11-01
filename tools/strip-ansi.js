

var ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g;

module.exports = function stripAnsi(str) {
	return typeof str === 'string' ? str.replace(ansiRegex, '') : str;
};
