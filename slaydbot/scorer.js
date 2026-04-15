function scoreFile(file, rules) {
  let score = 100;
  let issues = [];

  const name = file.filename;
  const patch = file.patch || "";

  for (const pattern of rules.riskyPatterns) {
    if (patch.includes(pattern)) {
      score -= 30;
      issues.push(`Risky pattern: ${pattern}`);
    }
  }

  if (name.toLowerCase().includes("readme")) {
    if (!patch.includes("#")) {
      score -= 40;
      issues.push("Missing markdown structure");
    }
  }

  if (file.changes > 300) {
    score -= 20;
    issues.push("Large change");
  }

  return { name, score, issues };
}

module.exports = { scoreFile };
