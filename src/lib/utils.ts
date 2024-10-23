import { AuthConfig, setEnvDefaults as defaultSetEnvDefaults } from "@auth/core"
import { RemixAuthConfig } from "./types.js"


export async function setEnvDefaults(
  envObject: any,
  config: RemixAuthConfig,
  suppressBasePathWarning = false
) {
    defaultSetEnvDefaults(envObject, config as AuthConfig, suppressBasePathWarning)
    config.adapter = typeof config.adapter === 'function' ? await config.adapter(envObject) : config.adapter
}
