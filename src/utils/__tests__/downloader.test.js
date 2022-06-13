const fs = require("fs");
const os = require("os");
const path = require("path");

const { currentArchitecture, currentTarget } = require("../system");
const { download } = require("../downloader");

const rootDir = path.join(__dirname, "../../../");

function rootFile(filename) {
  return path.join(rootDir, filename);
}

describe("download", () => {
  function cleanup() {
    if (fs.existsSync("lintje")) {
      fs.rmSync(rootFile("lintje"));
    }
  }

  beforeEach(() => {
    cleanup();
  });
  afterEach(() => {
    cleanup();
  });

  function lintjeExecutableName() {
    if (os.platform() == "win32") {
      return "lintje.exe";
    } else {
      return "lintje";
    }
  }

  test("downloads and extracts the lintje executable", async () => {
    const expectedArchiveFile = rootFile(`${currentArchitecture()}-${currentTarget()}.tar.gz`);
    expect(fs.existsSync(expectedArchiveFile)).toBe(false);

    await download();

    expect(fs.existsSync(expectedArchiveFile)).toBe(false);
    expect(fs.existsSync(rootFile(lintjeExecutableName()))).toBe(true);
  });
});
