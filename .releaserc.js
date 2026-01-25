module.exports = {
    branches: [
        {name: "main"},
        {name: "next", prerelease: true}
    ],
    tagFormat: "v${version}",
    plugins: [
        [
            "@semantic-release/commit-analyzer",
            {
                releaseRules: [
                    {type: "style", release: "patch"}
                ]
            }
        ],
        "@semantic-release/release-notes-generator",
        [
            "@semantic-release/npm",
            {npmPublish: false, pkgRoot: "."}
        ],
        [
            "@semantic-release/npm",
            {npmPublish: false, pkgRoot: "client"}
        ],
        [
            "@semantic-release/npm",
            {npmPublish: false, pkgRoot: "server"}
        ],
        "@semantic-release/changelog",
        [
            "@semantic-release/exec",
            {
                prepareCmd: "sed -i '' 's/^appVersion:.*/appVersion: \"${nextRelease.version}\"/' helm/localcrag/Chart.yaml"
            }
        ],
        "@semantic-release/github",
        [
            "@semantic-release/git",
            {
                assets: [
                    "package.json",
                    "client/package.json",
                    "server/package.json",
                    "helm/localcrag/Chart.yaml",
                    "CHANGELOG.md"
                ],
                message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
            }
        ]
    ]
};