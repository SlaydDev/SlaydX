const rules = {
  maxLinesChanged: 500,

  criticalPaths: [
    "src/main",
    "src/preload",
    "electron",
  ],

  safePaths: [
    "src/renderer",
    "docs",
    "assets",
  ],

  riskyPatterns: [
    "eval(",
    "new Function",
    "child_process",
    "exec(",
    "spawn(",
    "dangerouslySetInnerHTML",
  ],
};

module.exports = { rules };
