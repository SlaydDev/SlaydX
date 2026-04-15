console.log("=== SLAYDBOT DEBUG ===");
console.log("GROQ exists:", !!process.env.GROQ_API_KEY);
console.log("GROQ length:", process.env.GROQ_API_KEY?.length);

// -------------------------
// IMPORTS
// -------------------------
const github = require("@actions/github");
const fetch = require("node-fetch");
const { aiReview } = require("./ai");

const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
const context = github.context;

const owner = context.repo.owner;
const repo = context.repo.repo;
const prNumber = process.env.PR_NUMBER;

// -------------------------
// GET PR DATA
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

async function closePR(reason) {
  await comment("## SlaydBot Blocked\n\n" + reason);

  await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: prNumber,
    state: "closed"
  });
}

// -------------------------
// MAIN
// -------------------------
(async () => {
  const files = await getFiles();

  let diffText = "";
  for (const file of files) {
    diffText += `\nFILE: ${file.filename}\n`;
    diffText += file.patch || "";
  }

  console.log("Calling AI...");

  let ai = await aiReview(diffText);

  console.log("AI RAW RESULT:", ai);

  // -------------------------
  // SAFE FALLBACK CLEANUP
  // -------------------------
  let score = 80;
  let reasons = [];

  if (!ai || typeof ai !== "object") {
    reasons.push("AI unavailable (invalid response)");
  } else {
    score = typeof ai.score === "number" ? ai.score : 0;

    // 🧠 CLEAN REASON FILTER (reject garbage AI output)
    if (Array.isArray(ai.reasons)) {
      reasons = ai.reasons.filter(r =>
        typeof r === "string" &&
        r.length > 3 &&
        !r.toLowerCase().includes("no json") &&
        !r.toLowerCase().includes("invalid input")
      );
    }

    if (reasons.length === 0) {
      reasons.push("No meaningful issues detected");
    }
  }

  // -------------------------
  // DECISION
  // -------------------------
  let decision = "REVIEW";

  if (score >= 75) decision = "APPROVED";
  else if (score >= 40) decision = "REVIEW";
  else decision = "BLOCK";

  // -------------------------
  // CLEAN REPORT
  // -------------------------
  const report = `
# SlaydBot Review

Score: ${score}/100
Decision: ${decision}

Issues:
${reasons.map(r => "- " + r).join("\n")}

Status:
${ai ? "AI ACTIVE" : "FALLBACK MODE"}
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
