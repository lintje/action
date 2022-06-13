const originalArch = process.arch;
const originalPlatform = process.platform;

function setArch(arch) {
  Object.defineProperty(process, "arch", { value: arch, writable: false });
}

function restoreArch() {
  setArch(originalArch);
}

function setPlatform(platform) {
  Object.defineProperty(process, "platform", { value: platform, writable: false });
}

function restorePlatform() {
  setPlatform(originalPlatform);
}

jest.mock("child_process", () => {
  return {
    spawnSync: jest.fn()
  };
});

const childProcess = require("child_process");
const { currentArchitecture, currentTarget } = require("../system");

describe("currentArchitecture", () => {
  afterEach(() => {
    restoreArch();
  });

  test("returns mapped architectures", () => {
    setArch("arm");
    expect(currentArchitecture()).toEqual("aarch64");

    setArch("arm64");
    expect(currentArchitecture()).toEqual("aarch64");

    setArch("x64");
    expect(currentArchitecture()).toEqual("x86_64");
  });

  test("when arch is unknown it throws an Error", () => {
    setArch("unknown");
    expect(currentArchitecture).toThrowError("Unknown architecture \"unknown\"");
  });
});

describe("currentTarget", () => {
  afterEach(() => {
    restorePlatform();
  });

  describe("when on Linux", () => {
    test("returns linux", () => {
      setPlatform("linux");
      childProcess.spawnSync.mockImplementation(() => {
        return { output: Buffer.from("ldd output for libc systems") };
      });
      expect(currentTarget()).toEqual("unknown-linux-gnu");
    });

    test("returns musl for musl systems", () => {
      setPlatform("linux");
      childProcess.spawnSync.mockImplementation(() => {
        return { output: Buffer.from("ldd output for musl systems") };
      });
      expect(currentTarget()).toEqual("unknown-linux-musl");
    });
  });

  describe("when on an unknown platform", () => {
    test("throws an error", () => {
      setPlatform("unknown");
      expect(currentTarget).toThrowError("Unknown platform \"unknown\"");
    });
  });
});
