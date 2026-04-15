console.log("=== SLAYDBOT DEBUG ===");
console.log("GROQ exists:", !!process.env.GROQ_API_KEY);

// -------------------------
const github = require("@actions/github");
const { aiReview } = require("./ai");

const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
const context = github.context;

const owner = context.repo.owner;
const repo = context.repo.repo;
const prNumber = process.env.PR_NUMBER;

// -------------------------
async function getFiles() {
  const { data } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber
  });
  return data;
}

async function addLabels(labels) {
  await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number: prNumber,
    labels
  });
}

async function comment(body) {
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body
  });
}

async function closePR(body) {
  await comment("## SlaydBot Blocked\n\n" + body);

  await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: prNumber,
    state: "closed"
  });
}

// -------------------------
(async () => {
  const files = await getFiles();

  let diffText = "";
  for (const file of files) {
    diffText += `\nFILE: ${file.filename}\n`;
    diffText += file.patch || "";
  }

  console.log("🧠 Calling AI...");

  let ai = await aiReview(diffText);

  console.log("AI RESULT:", ai);

  // -------------------------
  // SAFE DEFAULTS
  // -------------------------
  let score = ai?.score ?? 65;
  let reasons = Array.isArray(ai?.reasons) ? ai.reasons : [];

  // CLEAN GARBAGE REASONS
  reasons = reasons.filter(r =>
    typeof r === "string" &&
    r.length > 5 &&
    !r.toLowerCase().includes("repository") &&
    !r.toLowerCase().includes("cloned successfully")
  );

  if (reasons.length === 0) {
    reasons.push("No major issues detected");
  }

  // -------------------------
  // DECISION LOGIC (SAFE)
  // -------------------------
  let decision = "REVIEW";

  if (score >= 85) decision = "APPROVED";
  else if (score >= 50) decision = "REVIEW";
  else decision = "BLOCK";

  // -------------------------
  // FORCE SAFETY RULE (IMPORTANT)
  // README changes should NOT be blocked
  // -------------------------
  const hasOnlyReadme = files.every(f => f.filename.includes("README"));

  if (hasOnlyReadme && decision === "BLOCK") {
    decision = "REVIEW";
    score = 60;
    reasons.push("Downgraded BLOCK → REVIEW (README-safe rule)");
  }

  // -------------------------
  // REPORT
  // -------------------------
  const report = `
# SlaydBot Review

Score: ${score}/100
Decision: ${decision}

Issues:
${reasons.map(r => "- " + r).join("\n")}
`;

  // -------------------------
  // EXECUTE
  // -------------------------
  if (decision === "APPROVED") {
    await addLabels(["slayd-approved"]);
    await comment(report);
  }

  if (decision === "REVIEW") {
    await addLabels(["slayd-review"]);
    await comment(report);
  }

  if (decision === "BLOCK") {
    await addLabels(["slayd-blocked"]);
    await closePR(report);
  }
})();
