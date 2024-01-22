var zlib = require("zlib");

function Compress(json) {
  let buffer = Buffer.from(json, "utf-8");
  let data = zlib.gzipSync(buffer);
  return data.toString("base64");
}

function Decompress(data) {
  const compressedBuffer = Buffer.from(data, "base64");
  let json = zlib.unzipSync(compressedBuffer);
  return json.toString("utf-8");
}
module.exports = { Compress, Decompress };
