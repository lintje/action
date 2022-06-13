const childProcess = require("child_process");

const core = require("@actions/core");
const github = require("@actions/github");

const { download } = require("./utils");

function runLintje(commitCount) {
  const commitRange = commitArgument(commitCount);
  const args = [commitRange];
  const branchValidation = core.getBooleanInput("branch_validation", { required: false });
  if (branchValidation === false) {
    args.push("--no-branch");
  }
  const hints = core.getBooleanInput("hints", { required: false });
  if (hints === false) {
    args.push("--no-hints");
  }
  core.debug(`Lintje arguments: ${args}`);
  const result = childProcess.spawnSync("./lintje", args);
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

async function main() {
  try {
    await download();
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
