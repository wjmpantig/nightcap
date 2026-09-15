const repo = "https://github.com/wjmpantig/nightcap"

/**
 * /releases/latest/download/<asset> always resolves to the newest release, so
 * these links never need touching when a version ships. Asset names match what
 * build.yml attaches (see README.md → Install).
 */
export const links = {
  repo,
  releases: `${repo}/releases`,
  windows: `${repo}/releases/latest/download/nightcap.exe`,
  macos: `${repo}/releases/latest/download/nightcap-macos.zip`,
  api: "https://api.github.com/repos/wjmpantig/nightcap/releases/latest",
} as const
