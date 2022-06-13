const path = require("path");
const { fetchChecksums, verifyChecksum } = require("../checksum");

describe("fetchChecksums", () => {
  test("returns an object of filenames and their checksums", () => {
    expect(fetchChecksums()).toEqual(expect.any(Object));
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
