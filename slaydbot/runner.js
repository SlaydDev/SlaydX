console.log("=== SLAYDBOT DEBUG ===");
console.log("GROQ exists:", !!process.env.GROQ_API_KEY);
console.log("GROQ length:", process.env.GROQ_API_KEY?.length);

// -------------------------
// IMPORTS
// -------------------------
const github = require("@actions/github");
const fetch = require("node-fetch");
const { aiReview } = require("./ai"); // ✅ FIXED IMPORT

const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
const context = github.context;

const owner = context.repo.owner;
const repo = context.repo.repo;
const prNumber = process.env.PR_NUMBER;

// -------------------------
// 📦 GET PR DATA
// -------------------------
async function getFiles() {
  const { data } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber
  });
  return data;
}

async function getComments() {
  const { data } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: prNumber
  });
  return data;
}

// -------------------------
// 🏷 LABELS
// -------------------------
async function addLabels(labels) {
  await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number: prNumber,
    labels
  });
}

// -------------------------
// 💬 COMMENT
// -------------------------
async function comment(body) {
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body
  });
}

// -------------------------
// 🔴 CLOSE PR
// -------------------------
async function closePR(reason) {
  await comment("## ❌ SlaydBot BLOCKED\n\n" + reason);

  await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: prNumber,
    state: "closed"
  });
}

// -------------------------
// 🧠 MAIN
// -------------------------
(async () => {
  const files = await getFiles();
  const comments = await getComments();

  let diffText = "";

  for (const file of files) {
    diffText += `\nFILE: ${file.filename}\n`;
    diffText += file.patch || "";
  }

  // -------------------------
  // ⚡ AI REVIEW
  // -------------------------
  console.log("🧠 Calling AI...");
  let ai = await aiReview(diffText);
  console.log("🧠 AI RESULT:", ai);

  // -------------------------
  // 🧮 FALLBACK RULES
  // -------------------------
  let score = 80;
  let reasons = [];

  if (!ai) {
    reasons.push("AI unavailable → using fallback rules");

    for (const file of files) {
      if ((file.patch || "").includes("eval")) {
        score -= 40;
        reasons.push("Dangerous pattern detected: eval()");
      }

      if (file.filename.includes("README")) {
        if (!file.patch?.includes("#")) {
          score -= 20;
          reasons.push("README missing structure");
        }
      }
    }
  } else {
    score = ai.score;
    reasons = ai.reasons;
  }

  let decision = ai?.decision || "REVIEW";

  if (score >= 75) decision = "APPROVED";
  else if (score >= 40) decision = "REVIEW";
  else decision = "BLOCK";

  score = Math.max(0, Math.min(100, score));

  // -------------------------
  // 📊 REPORT
  // -------------------------
  const report = `
# 🤖 SlaydBot AI Review

## 📊 Score: ${score}/100
## 📌 Decision: ${decision}

---

## 🧠 Reasons
${reasons.length ? reasons.map(r => `- ${r}`).join("\n") : "- None"}

---

## 🏷 Final State
${decision === "APPROVED" ? "🟢 APPROVED" : decision === "REVIEW" ? "🟡 REVIEW" : "🔴 BLOCKED"}
`;

  // -------------------------
  // 🚀 EXECUTE RESULT
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
