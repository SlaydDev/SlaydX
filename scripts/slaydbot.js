const { analyzePR } = require("../slaydbot/analyzer");
const { getOctokit, context } = require("@actions/github");

const token = process.env.GITHUB_TOKEN;
const prNumber = process.env.PR_NUMBER;

const octokit = getOctokit(token);

async function getFiles() {
  const { data } = await octokit.rest.pulls.listFiles({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  return data;
}

async function comment(body) {
  await octokit.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    body,
  });
}

async function label(labels) {
  await octokit.rest.issues.addLabels({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    labels,
  });
}

async function close() {
  await octokit.rest.pulls.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
    state: "closed",
  });
}

(async () => {
  const files = await getFiles();
  const result = analyzePR(files);

  const { decision, score, reasons } = result;

  const report = `
🤖 SlaydBot Report

Score: ${score}/100
Decision: ${decision}

Details:
${reasons.length ? reasons.join("\n") : "No issues detected"}
`;

  if (decision === "APPROVED") {
    await label(["slayd-approved"]);
    await comment("✅ APPROVED\n\n" + report);
  }

  if (decision === "REVIEW") {
    await label(["slayd-review"]);
    await comment("⚠️ REVIEW REQUIRED\n\n" + report);
  }

  if (decision === "BLOCK") {
    await label(["slayd-blocked"]);
    await comment("❌ BLOCKED\n\n" + report);
    await close();
  }
})();
