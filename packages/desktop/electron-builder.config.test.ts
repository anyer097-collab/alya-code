import { expect, test } from "bun:test"
import type { Configuration } from "electron-builder"

const legacyDesktopEntry = "resources/linux/alya-code-desktop.desktop"

const channels = [
  { channel: "dev", appId: "ai.alya-code.desktop.dev" },
  { channel: "beta", appId: "ai.alya-code.desktop.beta" },
  { channel: "prod", appId: "ai.alya-code.desktop" },
] as const

for (const channel of channels) {
  test(`uses one Linux desktop identity for ${channel.channel}`, async () => {
    const previous = process.env.ALYA_CODE_CHANNEL
    process.env.ALYA_CODE_CHANNEL = channel.channel

    const module = await import(`./electron-builder.config.ts?channel=${channel.channel}`)
    const config = module.default as Configuration

    if (previous === undefined) delete process.env.ALYA_CODE_CHANNEL
    else process.env.ALYA_CODE_CHANNEL = previous

    expect(config.appId).toBe(channel.appId)
    expect(config.extraMetadata?.desktopName).toBe(`${channel.appId}.desktop`)
    expect(config.linux?.executableName).toBe(channel.appId)
    expect(config.linux?.desktop?.entry?.StartupWMClass).toBe(channel.appId)
    expect(config.deb?.fpm).toContainEqual(expect.stringContaining(`/usr/share/metainfo/${channel.appId}.metainfo.xml`))
    expect(config.rpm?.fpm).toContainEqual(expect.stringContaining(`/usr/share/metainfo/${channel.appId}.metainfo.xml`))
  })
}

test("keeps a hidden prod launcher for old Linux pins", async () => {
  const previous = process.env.ALYA_CODE_CHANNEL
  process.env.ALYA_CODE_CHANNEL = "prod"

  const module = await import("./electron-builder.config.ts?compat=prod")
  const config = module.default as Configuration

  if (previous === undefined) delete process.env.ALYA_CODE_CHANNEL
  else process.env.ALYA_CODE_CHANNEL = previous

  expect(
    config.deb?.fpm?.some((entry) =>
      entry.endsWith("alya-code-desktop.desktop=/usr/share/applications/alya-code-desktop.desktop"),
    ),
  ).toBe(true)
  expect(
    config.rpm?.fpm?.some((entry) =>
      entry.endsWith("alya-code-desktop.desktop=/usr/share/applications/alya-code-desktop.desktop"),
    ),
  ).toBe(true)

  const desktop = await Bun.file(legacyDesktopEntry).text()
  expect(desktop).toContain("Exec=/opt/Alya Code/ai.alya-code.desktop %U")
  expect(desktop).toContain("Icon=ai.alya-code.desktop")
  expect(desktop).toContain("StartupWMClass=ai.alya-code.desktop")
  expect(desktop).toContain("NoDisplay=true")
})

test("bundles the CLI outside the dev app archive", async () => {
  const previous = process.env.ALYA_CODE_CHANNEL
  process.env.ALYA_CODE_CHANNEL = "dev"
  const module = await import("./electron-builder.config.ts?cli-resource")
  const config = module.default as Configuration
  if (previous === undefined) delete process.env.ALYA_CODE_CHANNEL
  else process.env.ALYA_CODE_CHANNEL = previous

  expect(config.files).toContain("!resources/alya-code-cli*")
  expect(config.extraResources).toContainEqual({
    from: "resources/",
    to: "",
    filter: ["alya-code-cli*"],
  })
})

for (const channel of ["beta", "prod"] as const) {
  test(`does not bundle the CLI in ${channel} builds`, async () => {
    const previous = process.env.ALYA_CODE_CHANNEL
    process.env.ALYA_CODE_CHANNEL = channel
    const module = await import(`./electron-builder.config.ts?no-cli-resource=${channel}`)
    const config = module.default as Configuration
    if (previous === undefined) delete process.env.ALYA_CODE_CHANNEL
    else process.env.ALYA_CODE_CHANNEL = previous

    expect(config.extraResources).not.toContainEqual({
      from: "resources/",
      to: "",
      filter: ["alya-code-cli*"],
    })
  })
}
