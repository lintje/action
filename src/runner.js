const childProcess = require("child_process");

const core = require("@actions/core");
const github = require("@actions/github");
const cache = require("@actions/cache");

const { LINTJE_VERSION } = require("./version");
const { download } = require("./utils");

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
  }
  core.debug(`Lintje arguments: ${args}`);
  const result = childProcess.spawnSync("./lintje", args, { env });
  return {
    ...result,
    stdout: (result.stdout || "").toString(),
  };
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

function formatOutput(statusLine, issueLines) {
  return `${statusLine}\n\n${issueLines}`.trim();
}

function handleSuccess(stdout) {
  const { statusLine, issueLines } = splitOutput(stdout);
  if (statusLine.endsWith(" hint") || statusLine.endsWith(" hints")) {
    core.notice(formatOutput(statusLine, issueLines));
  } else {
    core.notice("Lintje has found no issues.");
  }
}

function handleFailure(stdout) {
  let { statusLine, issueLines } = splitOutput(stdout);
  core.setFailed(formatOutput(statusLine, issueLines));
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

async function main() {
  try {
    await downloadIfNotCached();
    const { context } = github;
    const { payload } = context;
    const commitCount = payload.commits.length;
    const { status, stdout, stderr, error } = runLintje(commitCount);

    if (error) {
      core.info(stdout);
      core.warning((stderr || "").toString());
      core.setFailed(`Lintje failed with status code "${status}": ${error}`);
      return;
    }

    switch (status) {
    case 0: // Lintje exited successfully without issues
      handleSuccess(stdout);

      if (stderr) {
        core.warning(stderr.toString());
      }
      break;
    case 1: // Lintje found issues
      handleFailure(stdout);

      if (stderr) {
        core.warning(stderr.toString());
      }
      break;
    case 2: // Internal Lintje failure
      core.setFailed("Lintje encountered an error while performing its checks.");
      core.info(stdout);
      core.error((stderr || "").toString());
      break;
    default:
      core.setFailed("Unknown exit code received from Lintje:", status);
      core.info(stdout);
      core.error((stderr || "").toString());
      break;
    }
  } catch (error) {
    core.setFailed(`Lintje failed with error: ${error.name}: ${error.message}\n${error.stack}`);
  }
}

module.exports = { run: main };
