jest.mock("child_process", () => {
  return { spawnSync: jest.fn() };
});

jest.mock("@actions/github", () => {
  return {};
});

jest.mock("@actions/cache", () => {
  return {
    saveCache: jest.fn(),
    restoreCache: jest.fn()
  };
});

// Don't download lintje for this test suite to limit the network
// traffic and speed up the tests
jest.mock("../utils/downloader", () => {
  return { download: jest.fn() };
});

const fs = require("fs");
const path = require("path");

const childProcess = require("child_process");
const github = require("@actions/github");
const cache = require("@actions/cache");

const { LINTJE_VERSION } = require("../version");
const { run } = require("../runner");
const { download } = require("../utils/downloader");

const rootDir = path.join(__dirname, "../../");
const colorEnv = { TERM: "xterm-256color" };

const annotationOptions = "title=Lintje (Git Linter)";

describe("runner", () => {
  function cleanup() {
    if (fs.existsSync("lintje")) {
      fs.rmSync(rootFile("lintje"));
    }
  }

  beforeEach(() => {
    // Mock default inputs
    setInput("branch_validation", true);
    setInput("hints", true);
    setInput("color", true);
    setInput("verbose", false);
    process.exitCode = undefined; // Reset exitCode
    cleanup();
  });
  afterEach(() => {
    cleanup();
  });

  test("runs lintje passing for 1 commit", async () => {
    // Mock event payload for the GitHub Action
    github.context = {
      payload: {
        commits: ["commit1"]
      }
    };

    const stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation();
    mockLintjeExecution({
      status: 0,
      stdout: intoBuffer(""),
      stderr: intoBuffer(""),
      error: null,
    });

    await run();

    expect(childProcess.spawnSync).toHaveBeenCalledWith(
      executable(),
      ["HEAD", "--color"],
      { env: colorEnv }
    );
    expect(stdoutSpy).toHaveBeenCalledWith(
      expect.stringContaining(`::notice ${annotationOptions}::Lintje has found no issues.`)
    );
    expect(process.exitCode).toBeUndefined(); // Success
  });

  test("runs lintje passing for multiple commits", async () => {
    // Mock event payload for the GitHub Action
    github.context = {
      payload: {
        commits: ["commit1", "commit2"]
      }
    };

    const stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation();
    mockLintjeExecution({
      status: 0,
      stdout: intoBuffer(""),
      stderr: intoBuffer(""),
      error: null,
    });

    await run();

    expect(childProcess.spawnSync).toHaveBeenCalledWith(
      executable(),
      ["HEAD~2...HEAD", "--color"],
      { env: colorEnv }
    );
    expect(stdoutSpy).toHaveBeenCalledWith(
      expect.stringContaining(`::notice ${annotationOptions}::Lintje has found no issues.`)
    );
    expect(process.exitCode).toBeUndefined(); // Success
  });

  test("runs lintje passing with hints", async () => {
    // Mock event payload for the GitHub Action
    github.context = {
      payload: {
        commits: ["commit1"]
      }
    };

    const stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation();
    mockLintjeExecution({
      status: 0,
      stdout: intoBuffer("Some hints output at the top\n\n1 commit and branch inspected, 0 errors detected, 1 hint"),
      stderr: intoBuffer(""),
      error: null,
    });

    await run();

    expect(childProcess.spawnSync).toHaveBeenCalledWith(
      executable(),
      ["HEAD", "--color"],
      { env: colorEnv }
    );
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining("Some hints output at the top"));
    expect(stdoutSpy)
      .toHaveBeenCalledWith(
        expect.stringContaining(
          `::notice ${annotationOptions}::1 commit and branch inspected, 0 errors detected, 1 hint`
        )
      );
    expect(process.exitCode).toBeUndefined(); // Success
  });

  test("runs lintje with issues", async () => {
    // Mock event payload for the GitHub Action
    github.context = {
      payload: {
        commits: ["commit1"]
      }
    };

    const stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation();
    mockLintjeExecution({
      status: 1,
      stdout: intoBuffer("Some Lintje issues\n\n1 commit and branch inspected, 1 errors detected"),
      stderr: intoBuffer(""),
      error: null,
    });

    await run();

    expect(childProcess.spawnSync).toHaveBeenCalledWith(
      executable(),
      ["HEAD", "--color"],
      { env: colorEnv }
    );
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining("Some Lintje issues"));
    expect(stdoutSpy)
      .toHaveBeenCalledWith(
        expect.stringContaining("::error::1 commit and branch inspected, 1 errors detected")
      );
    expect(process.exitCode).toEqual(1); // Failure
  });

  test("runs lintje with internal error", async () => {
    // Mock event payload for the GitHub Action
    github.context = {
      payload: {
        commits: ["commit1"]
      }
    };

    const stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation();
    mockLintjeExecution({
      status: 2,
      stdout: intoBuffer("Some Lintje error"),
      stderr: intoBuffer(""),
      error: null,
    });

    await run();

    expect(childProcess.spawnSync).toHaveBeenCalledWith(
      executable(),
      ["HEAD", "--color"],
      { env: colorEnv }
    );
    expect(stdoutSpy)
      .toHaveBeenCalledWith(
        expect.stringContaining("::error::Lintje encountered an error while performing its checks.")
      );
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining("Some Lintje error"));
    expect(process.exitCode).toEqual(1); // Failure
  });

  test("runs lintje with Node.js error", async () => {
    // Mock event payload for the GitHub Action
    github.context = {
      payload: {
        commits: ["commit1"]
      }
    };

    const stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation();
    download.mockImplementation(() => {
      throw new Error("Oh no!");
    });

    await run();

    expect(childProcess.spawnSync).not.toHaveBeenCalled();
    expect(stdoutSpy).toHaveBeenCalledWith(
      expect.stringContaining("::error::Lintje failed with error: Error: Oh no!")
    );
    expect(process.exitCode).toEqual(1); // Failure
  });

  test("runs lintje without branch validation", async () => {
    setInput("branch_validation", false);
    // Mock event payload for the GitHub Action
    github.context = {
      payload: {
        commits: ["commit1"]
      }
    };

    mockLintjeExecution({
      status: 0,
      stdout: intoBuffer(""),
      stderr: intoBuffer(""),
      error: null,
    });

    await run();

    expect(childProcess.spawnSync).toHaveBeenCalledWith(
      executable(),
      ["HEAD", "--no-branch", "--color"],
      { env: colorEnv }
    );
    expect(process.exitCode).toBeUndefined(); // Success
  });

  test("runs lintje without hint validation", async () => {
    setInput("hints", false);
    // Mock event payload for the GitHub Action
    github.context = {
      payload: {
        commits: ["commit1"]
      }
    };

    mockLintjeExecution({
      status: 0,
      stdout: intoBuffer(""),
      stderr: intoBuffer(""),
      error: null,
    });

    await run();

    expect(childProcess.spawnSync).toHaveBeenCalledWith(
      executable(),
      ["HEAD", "--no-hints", "--color"],
      { env: colorEnv }
    );
    expect(process.exitCode).toBeUndefined(); // Success
  });

  test("strips color of notice", async () => {
    // Mock event payload for the GitHub Action
    github.context = {
      payload: {
        commits: ["commit1"]
      }
    };

    const stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation();
    mockLintjeExecution({
      status: 1,
      stdout: intoBuffer("Some \u{1b}[0mcolored error lines\n\n1 commit and branch inspected, \u{1b}[0m\u{1b}[31m3 errors detected\u{1b}[0m"),
      stderr: intoBuffer(""),
      error: null,
    });

    await run();

    expect(process.exitCode).toEqual(1); // Failure
    expect(childProcess.spawnSync).toHaveBeenCalledWith(
      executable(),
      ["HEAD", "--color"],
      { env: colorEnv }
    );
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining("Some \u{1b}[0mcolored error lines"));
    expect(stdoutSpy).toHaveBeenCalledWith(
      expect.stringContaining("::error::1 commit and branch inspected, 3 errors detected")
    );
  });

  test("runs lintje without color", async () => {
    setInput("color", false);
    // Mock event payload for the GitHub Action
    github.context = {
      payload: {
        commits: ["commit1"]
      }
    };

    mockLintjeExecution({
      status: 0,
      stdout: intoBuffer(""),
      stderr: intoBuffer(""),
      error: null,
    });

    await run();

    expect(childProcess.spawnSync).toHaveBeenCalledWith(
      executable(),
      ["HEAD", "--no-color"],
      { env: {} }
    );
    expect(process.exitCode).toBeUndefined(); // Success
  });

  test("runs lintje with verbose mode", async () => {
    setInput("verbose", true);
    // Mock event payload for the GitHub Action
    github.context = {
      payload: {
        commits: ["commit1"]
      }
    };

    mockLintjeExecution({
      status: 0,
      stdout: intoBuffer(""),
      stderr: intoBuffer(""),
      error: null,
    });

    await run();

    expect(childProcess.spawnSync).toHaveBeenCalledWith(
      executable(),
      ["HEAD", "--color", "--verbose"],
      { env: colorEnv }
    );
    expect(process.exitCode).toBeUndefined(); // Success
  });

  test("without cache it downloads Lintje", async () => {
    // Mock event payload for the GitHub Action
    github.context = {
      payload: {
        commits: ["commit1"]
      }
    };

    mockLintjeExecution({
      status: 0,
      stdout: intoBuffer(""),
      stderr: intoBuffer(""),
      error: null,
    });
    cache.restoreCache.mockImplementation(() => {
      return undefined;
    });

    await run();

    expect(cache.restoreCache).toHaveBeenCalledWith(["lintje"], `lintje-${LINTJE_VERSION}`, []);
    expect(cache.saveCache).toHaveBeenCalledWith(["lintje"], `lintje-${LINTJE_VERSION}`);
    expect(download).toHaveBeenCalled();
    expect(childProcess.spawnSync).toHaveBeenCalledWith(
      executable(),
      ["HEAD", "--color"],
      { env: colorEnv }
    );
    expect(process.exitCode).toBeUndefined(); // Success
  });

  test("with cache it doesn't download Lintje", async () => {
    // Mock event payload for the GitHub Action
    github.context = {
      payload: {
        commits: ["commit1"]
      }
    };

    mockLintjeExecution({
      status: 0,
      stdout: intoBuffer(""),
      stderr: intoBuffer(""),
      error: null,
    });
    cache.restoreCache.mockImplementation(() => {
      return "Some cache id";
    });

    await run();

    expect(cache.restoreCache).toHaveBeenCalledWith(["lintje"], `lintje-${LINTJE_VERSION}`, []);
    expect(cache.saveCache).not.toHaveBeenCalled();
    expect(download).not.toHaveBeenCalled();
    expect(childProcess.spawnSync).toHaveBeenCalledWith(
      executable(),
      ["HEAD", "--color"],
      { env: colorEnv }
    );
    expect(process.exitCode).toBeUndefined(); // Success
  });
});

function executable() {
  if (process.platform === "win32") {
    return "./lintje.exe";
  }
  return "./lintje";
}

function rootFile(filename) {
  return path.join(rootDir, filename);
}

function intoBuffer(string) {
  return Buffer.from(string);
}

function setInput(name, value) {
  process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] = value;
}

function mockLintjeExecution(resultObject) {
  childProcess.spawnSync.mockImplementation((program) => {
    switch (program) {
    case "./lintje.exe":
      return resultObject;
    case "./lintje":
      return resultObject;
    case "ldd": {
      // Ubuntu (non-musl) `ldd --version` output.
      // This means this test suite won't work on a musl system.
      const stdout = "ldd (Ubuntu GLIBC 2.31-0ubuntu9.9) 2.31";
      return {
        status: 0,
        output: [stdout],
        stdout
      };
    }
    default: {
      const error =`Unknown program to mock: "${program}"`;
      console.error(error);
      throw new Error(error);
    }
    }
  });
}
