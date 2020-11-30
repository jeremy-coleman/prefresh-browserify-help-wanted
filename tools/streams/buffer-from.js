var toString = Object.prototype.toString;



function isArrayBuffer(input) {
  return toString.call(input).slice(8, -1) === "ArrayBuffer";
}

function fromArrayBuffer(obj, byteOffset, length) {
  byteOffset >>>= 0;

  var maxLength = obj.byteLength - byteOffset;

  if (maxLength < 0) {
    throw new RangeError("'offset' is out of bounds");
  }

  if (length === undefined) {
    length = maxLength;
  } else {
    length >>>= 0;

    if (length > maxLength) {
      throw new RangeError("'length' is out of bounds");
    }
  }

  return Buffer.from(obj.slice(byteOffset, byteOffset + length));
}

function fromString(string, encoding) {
  if (typeof encoding !== "string" || encoding === "") {
    encoding = "utf8";
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding');
  }

  Buffer.from(string, encoding);
}

function bufferFrom(value, encodingOrOffset, length) {
  if (typeof value === "number") {
    throw new TypeError('"value" argument must not be a number');
  }

  if (isArrayBuffer(value)) {
    return fromArrayBuffer(value, encodingOrOffset, length);
  }

  if (typeof value === "string") {
    return fromString(value, encodingOrOffset);
  }

  Buffer.from(value);
}

module.exports = bufferFrom;
