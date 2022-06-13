const fs = require("fs");
const { pipeline } = require("node:stream/promises");
const fetch = require("node-fetch");
const { LINTJE_VERSION } = require("../version");
const { fetchChecksums, verifyChecksum } = require("./checksum");
const { currentArchitecture, currentTarget } = require("./system");
const tar = require("tar");

// Download Lintje excutable
async function download() {
  const arch = currentArchitecture();
  const target = currentTarget();
  const filename = `${arch}-${target}.tar.gz`;
  const downloadUrl =
    `https://github.com/tombruijn/lintje/releases/download/v${LINTJE_VERSION}/${filename}`;
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`Error while downloading Lintje archive: ${response.status} ${response.statusText}: ${response.body}`);
  }
  await pipeline(
    response.body,
    fs.createWriteStream(filename),
  ).catch(function (error) {
    if (error) {
      console.error("Error downloading and saving Lintje archive:", error);
    }
  });

  const checksums = fetchChecksums();
  const expectedChecksum = checksums[filename];
  await verifyChecksum(filename, expectedChecksum);
  await extractArchive(filename);
  await removeFile(filename);
}

// Unpackage the downloaded archive file
async function extractArchive(filename) {
  await tar.extract({ file: filename });
}

async function removeFile(filename) {
  return new Promise(function(resolve, reject) {
    fs.rm(filename, function(error) {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

module.exports = { download };
