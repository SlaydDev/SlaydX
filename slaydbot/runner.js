const github = require("@actions/github");
const { analyzePR } = require("./analyzer");

const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
const context = github.context;

const owner = context.repo.owner;
const repo = context.repo.repo;
const prNumber = process.env.PR_NUMBER;

async function getFiles() {
  const { data } = await octokit.rest.pulls.listFiles({
    owner, repo, pull_number: prNumber,
  });
  return data;
}

async function getComments() {
  const { data } = await octokit.rest.issues.listComments({
    owner, repo, issue_number: prNumber,
  });
  return data;
}

async function label(labels) {
  await octokit.rest.issues.addLabels({
    owner, repo, issue_number: prNumber, labels
  });
}

async function comment(body) {
  await octokit.rest.issues.createComment({
    owner, repo, issue_number: prNumber, body
  });
}

async function close() {
  await octokit.rest.pulls.update({
    owner, repo, pull_number: prNumber, state: "closed"
  });
}

(async () => {
  const files = await getFiles();
  const comments = await getComments();

  const { decision, score, reasons, fileReports } = analyzePR(files, comments);

  const fileSection = fileReports.map(f => `
### 📄 ${f.name}
Score: **${f.score}**
${f.issues.length ? f.issues.map(i => `- ${i}`).join("\n") : "- Clean"}
`).join("\n");

  const report = `
# 🤖 SlaydBot Advanced Review

## 📊 Overall Score: **${score}/100**
## 📌 Decision: **${decision}**

---

## 📂 File Analysis
${fileSection}

---

## 🧠 System Warnings
${reasons.length ? reasons.map(r => `- ${r}`).join("\n") : "- None"}

---

## 🏷️ Final Status
${decision === "APPROVED" ? "🟢 APPROVED" : decision === "REVIEW" ? "🟡 REVIEW REQUIRED" : "🔴 BLOCKED"}
`;

  if (decision === "APPROVED") {
    await label(["slayd-approved"]);
    await comment(report);
  }

  if (decision === "REVIEW") {
    await label(["slayd-review"]);
    await comment(report);
  }

  if (decision === "BLOCK") {
    await label(["slayd-blocked"]);
    await comment(report);
    await close();
  }
})();
