const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function fetchChecksums() {
  const checksums = {};
  const filename = path.join(__dirname, "../../checksums_256.txt");
  const contents = fs.readFileSync(filename, { encoding: "utf8" }).trim();
  const lines = contents.split("\n");
  for (let line of lines) {
    const [checksum, filename] = line.split("  ");
    checksums[filename] = checksum;
  }
  return checksums;
}

function verifyChecksum(filepath, checksum) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filepath)
      .pipe(crypto.createHash("SHA256").setEncoding("hex"))
      .on("finish", function() {
        this.end();

        const actual = this.read();
        if (actual === checksum) {
          return resolve();
        } else {
          return reject(
            new Error(
              "Checksum verification failed.\n" +
              `Expected: "${checksum}"\n` +
              `Actual:   "${actual}"`
            )
          );
        }
      });
  });
}

module.exports = {
  fetchChecksums,
  verifyChecksum
};
