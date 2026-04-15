const { rules } = require("./rules");
const { scoreFile } = require("./scorer");

function analyzePR(files, comments) {
  let totalScore = 0;
  let fileReports = [];
  let reasons = [];

  for (const file of files) {
    const result = scoreFile(file, rules);
    fileReports.push(result);
    totalScore += result.score;
  }

  let score = Math.round(totalScore / files.length);

  // 🤖 Codex detection
  for (const c of comments) {
    if (c.user.login.includes("codex")) {
      const body = c.body.toLowerCase();

      if (body.includes("p1")) {
        score -= 40;
        reasons.push("Codex flagged P1 issue");
      }

      if (body.includes("p0")) {
        score = 0;
        reasons.push("Codex flagged CRITICAL issue");
      }
    }
  }

  score = Math.max(0, Math.min(100, score));

  let decision;
  if (score >= 75) decision = "APPROVED";
  else if (score >= 40) decision = "REVIEW";
  else decision = "BLOCK";

  return { decision, score, reasons, fileReports };
}

module.exports = { analyzePR };
