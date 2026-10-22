const path = require("path");
const { fetchChecksums, parseChecksums, verifyChecksum } = require("../checksum");

describe("fetchChecksums", () => {
  test("returns an object of filenames and their checksums", () => {
    expect(fetchChecksums()).toEqual(expect.any(Object));
  });

  test("it returns a checksum for every archive in the manifest", () => {
    const checksums = fetchChecksums();
    const archives = Object.keys(checksums);

    expect(archives.length).toBeGreaterThan(0);

    for (const archive of archives) {
      // The archive name should not contain any whitespace, otherwise the
      // checksum cannot be found. This happens when the manifest is checked
      // out with Windows line endings.
      expect(archive).not.toMatch(/\s/);
      expect(checksums[archive]).toMatch(/^[a-f0-9]{64}$/);
    }
  });
});

describe("parseChecksums", () => {
  const checksums = {
    "x86_64-pc-windows-gnu.tar.gz": "d28b57e41bfb8cc67b225e2d9b03fa862c830c7b6c816e7e503b08ec8f214252",
    "x86_64-unknown-linux-gnu.tar.gz": "2a600a4da8fcf52757e1e68479e36924a5b3cbc8fe7133d1a9d3894699c398cf"
  };
  const manifest = [
    `${checksums["x86_64-pc-windows-gnu.tar.gz"]}  x86_64-pc-windows-gnu.tar.gz`,
    `${checksums["x86_64-unknown-linux-gnu.tar.gz"]}  x86_64-unknown-linux-gnu.tar.gz`
  ].join("\n");

  test("it parses a manifest with Unix line endings", () => {
    expect(parseChecksums(manifest)).toEqual(checksums);
  });

  test("it parses a manifest with Windows line endings", () => {
    expect(parseChecksums(manifest.replace(/\n/g, "\r\n"))).toEqual(checksums);
  });

  test("it parses a manifest with a trailing line ending", () => {
    expect(parseChecksums(`${manifest}\n`)).toEqual(checksums);
    expect(parseChecksums(`${manifest}\r\n`)).toEqual(checksums);
  });
});

describe("verifyChecksum", () => {
  const actualChecksum = "3f0bc2b7878a34291449e04a5429cf82b4fb561bb0b1fe3974f9d770bea63432";

  test("when checksum matches it resolves", async () => {
    // The `test_file.txt` is a single line file. If it has multiple lines it
    // will not work on Windows because it uses different line endings.
    await expect(verifyChecksum(
      path.join(__dirname, "test_file.txt"),
      actualChecksum
    )).resolves.toBeUndefined();
  });

  test("when checksum do not match it rejects", async () => {
    const dummyChecksum = "dummy";

    await expect(verifyChecksum(
      path.join(__dirname, "test_file.txt"),
      dummyChecksum
    )).rejects.toThrow(
      "Checksum verification failed.\n" +
      `Expected: "${dummyChecksum}"\n` +
      `Actual:   "${actualChecksum}"`
    );
  });
});
