const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Parse the contents of a checksum manifest into an object of archive
// filenames and their checksums.
function parseChecksums(contents) {
  const checksums = {};
  // Git checks text files out with CRLF line endings on Windows, so split on
  // both line ending styles to keep a trailing carriage return out of the
  // filenames.
  const lines = contents.split(/\r?\n/);
  for (let line of lines) {
    const [checksum, filename] = line.trim().split(/\s+/);
    if (!checksum || !filename) {
      continue;
    }
    checksums[filename] = checksum;
  }
  return checksums;
}

function fetchChecksums() {
  const filename = path.join(__dirname, "../../checksums_256.txt");
  const contents = fs.readFileSync(filename, { encoding: "utf8" });
  return parseChecksums(contents);
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
  parseChecksums,
  verifyChecksum
};
