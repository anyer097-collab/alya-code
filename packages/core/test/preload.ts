import path from "path"

process.env.ALYA_CODE_DB = ":memory:"
process.env.NPM_CONFIG_AUDIT = "false"
process.env.ALYA_CODE_MODELS_PATH = path.join(import.meta.dir, "plugin", "fixtures", "models-dev.json")
process.env.ALYA_CODE_DISABLE_MODELS_FETCH = "true"
