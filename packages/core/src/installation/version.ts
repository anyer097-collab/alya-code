declare global {
  const ALYA_CODE_VERSION: string
  const ALYA_CODE_CHANNEL: string
}

export const InstallationVersion = typeof ALYA_CODE_VERSION === "string" ? ALYA_CODE_VERSION : "local"
export const InstallationChannel = typeof ALYA_CODE_CHANNEL === "string" ? ALYA_CODE_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
