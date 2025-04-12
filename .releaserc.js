module.exports = {
  branches: [
    { name: "main" },
    { name: "next", prerelease: true }
  ],
  tagFormat: "v${version}",
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        releaseRules: [
          { type: "style", release: "patch" }
        ]
      }
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        writerOpts: {
          transform: (commit, context) => {
            if (commit.type === "style") {
              return {
                ...commit,
                type: "Style Changes"
              };
            }
            return commit;
          }
        }
      }
    ],
    [
      "@semantic-release/npm",
      { npmPublish: false, pkgRoot: "." }
    ],
    [
      "@semantic-release/npm",
      { npmPublish: false, pkgRoot: "client" }
    ],
    [
      "@semantic-release/npm",
      { npmPublish: false, pkgRoot: "server" }
    ],
    "@semantic-release/changelog",
    "@semantic-release/github",
    [
      "@semantic-release/git",
      {
        assets: [
          "package.json",
          "client/package.json",
          "server/package.json",
          "CHANGELOG.md"
        ],
        message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ]
  ]
};