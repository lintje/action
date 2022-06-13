const childProcess = require("child_process");

function currentArchitecture() {
  const arch = process.arch;
  switch (arch) {
  case "x64":
    return "x86_64";
  case "arm":
    return "aarch64";
  case "arm64":
    return "aarch64";
  default:
    throw new Error(`Unknown architecture "${arch}"`);
  }
}

function currentTarget() {
  switch (process.platform) {
  case "linux": {
    const { output } = childProcess.spawnSync("ldd", ["--version"]);
    if (output.toString().includes("musl")) {
      return "unknown-linux-musl";
    } else {
      return "unknown-linux-gnu";
    }
  }
  case "darwin":
    return "apple-darwin";
  case "win32":
    return "pc-windows-gnu";
  default:
    throw new Error(`Unknown platform "${process.platform}"`);
  }
}

module.exports = {
  currentArchitecture,
  currentTarget
};
