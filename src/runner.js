const childProcess = require("child_process");

const core = require("@actions/core");
const github = require("@actions/github");
const cache = require("@actions/cache");

const { LINTJE_VERSION } = require("./version");
const { download } = require("./utils");

const annotationOptions = { title: "Lintje (Git Linter)" };

function runLintje(commitCount) {
  const commitRange = commitArgument(commitCount);
  const env = {};
  const args = [commitRange];
  const branchValidation = core.getBooleanInput("branch_validation", { required: false });
  if (branchValidation === false) {
    args.push("--no-branch");
  }
  const hints = core.getBooleanInput("hints", { required: false });
  if (hints === false) {
    args.push("--no-hints");
  }
  const color = core.getBooleanInput("color", { required: false });
  if (color === true) {
    args.push("--color");
    // Add TERM environment variable so the Lintje color support detection
    // thinks it supports color output. Otherwise it doesn't.
    env["TERM"] = "xterm-256color";
  } else {
    args.push("--no-color");
  }
  core.debug(`Lintje arguments: ${args}`);
  const result = childProcess.spawnSync(executable(), args, { env });
  return {
    ...result,
    stdout: (result.stdout || "").toString(),
  };
}

function executable() {
  if (process.platform === "win32") {
    return "./lintje.exe";
  }
  return "./lintje";
}

function commitArgument(commitCount) {
  if (commitCount > 1) {
    return `HEAD~${commitCount}...HEAD`;
  }
  return "HEAD";
}

function splitOutput(stdout) {
  const lines = stdout.trim().split("\n");
  const maxLineIndex = lines.length - 1;
  const issueLines = lines.slice(0, maxLineIndex).join("\n");
  const statusLine = lines[maxLineIndex];
  return { statusLine, issueLines };
}

function removeColorOutput(string) {
  /* eslint-disable-next-line no-control-regex */
  return string.replace(/\x1B\[\d{1,2}m/g, "");
}

function handleSuccess(stdout) {
  const { statusLine, issueLines } = splitOutput(stdout);
  if (statusLine.endsWith(" hint") || statusLine.endsWith(" hints")) {
    core.info(issueLines);
    logNotice(removeColorOutput(statusLine));
  } else {
    logNotice("Lintje has found no issues.");
  }
}

function handleFailure(stdout) {
  let { statusLine, issueLines } = splitOutput(stdout);
  core.info(issueLines);
  core.setFailed(removeColorOutput(statusLine));
}

async function downloadIfNotCached() {
  const paths = ["lintje"];
  const cacheKey = `lintje-${LINTJE_VERSION}`;
  const cacheId = await cache.restoreCache(paths, cacheKey, []);

  if (cacheId) {
    // The cache has been restored, no need to download Lintje.
    return;
  }

  await download();

  // Store Lintje in the cache for next time so it doesn't need to download
  // it again.
  await cache.saveCache(paths, cacheKey);
}

function logNotice(string) {
  core.notice(string, annotationOptions);
}

function logWarning(string) {
  core.warning(string, annotationOptions);
}

function logError(string) {
  core.error(string, annotationOptions);
}

async function main() {
  try {
    await downloadIfNotCached();
    const { context } = github;
    const { payload } = context;
    const commitCount = payload.commits.length;
    const { status, stdout, stderr, error } = runLintje(commitCount);

    if (error) {
      core.info(stdout);
      logWarning((stderr || "").toString());
      core.setFailed(`Lintje failed with status code "${status}": ${error}`);
      return;
    }

    switch (status) {
    case 0: // Lintje exited successfully without issues
      handleSuccess(stdout);

      if (stderr) {
        logWarning(stderr.toString());
      }
      break;
    case 1: // Lintje found issues
      handleFailure(stdout);

      if (stderr) {
        logWarning(stderr.toString());
      }
      break;
    case 2: // Internal Lintje failure
      core.setFailed("Lintje encountered an error while performing its checks.");
      core.info(stdout);
      logError((stderr || "").toString());
      break;
    default:
      core.setFailed(`Unknown exit code received from Lintje: ${status}`);
      core.info(stdout);
      logError((stderr || "").toString());
      break;
    }
  } catch (error) {
    core.setFailed(`Lintje failed with error: ${error.name}: ${error.message}\n${error.stack}`);
  }
}

module.exports = { run: main };
