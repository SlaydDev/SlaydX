const { rules } = require("./rules");

function analyzePR(files) {
  let score = 100;
  let reasons = [];

  let totalChanges = 0;
  let touchesCritical = false;

  for (const file of files) {
    const name = file.filename;
    const patch = file.patch || "";
    const changes = file.changes || 0;

    totalChanges += changes;

    // 🚨 critical file changes
    if (rules.criticalPaths.some(p => name.includes(p))) {
      touchesCritical = true;
      score -= 25;
      reasons.push(`Critical system modified: ${name}`);
    }

    // 🧠 risky patterns detection
    for (const pattern of rules.riskyPatterns) {
      if (patch.includes(pattern)) {
        score -= 35;
        reasons.push(`Risky pattern detected: "${pattern}" in ${name}`);
      }
    }

    // 📦 huge file penalty
    if (changes > 300) {
      score -= 20;
      reasons.push(`Large file change: ${name}`);
    }
  }

  // 📉 total size penalty
  if (totalChanges > rules.maxLinesChanged) {
    score -= 25;
    reasons.push("PR too large (should be split)");
  }

  // 🧠 IMPORTANT: reduce false positives
  if (touchesCritical && score > 50) {
    score = Math.max(score, 55); 
  }

  // clamp score
  score = Math.max(0, Math.min(100, score));

  let decision;

  // 🔥 IMPORTANT: bias toward REVIEW instead of BLOCK
  if (score >= 75) decision = "APPROVED";
  else if (score >= 40) decision = "REVIEW";
  else decision = "BLOCK";

  return {
    decision,
    score,
    reasons
  };
}

module.exports = { analyzePR };
