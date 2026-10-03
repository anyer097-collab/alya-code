const stage = process.env.SST_STAGE || "dev"

export default {
  url: stage === "production" ? "https://opencode.ai" : `https://${stage}.alya-code.ai`,
  console: stage === "production" ? "https://opencode.ai/auth" : `https://${stage}.alya-code.ai/auth`,
  email: "help@anoma.ly",
  socialCard: "https://social-cards.sst.dev",
  github: "https://github.com/anyer097-collab/alya-code",
  discord: "https://opencode.ai/discord",
  headerLinks: [
    { name: "app.header.home", url: "/" },
    { name: "app.header.docs", url: "/v2/docs" },
  ],
}
