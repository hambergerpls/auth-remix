import { AuthConfig, setEnvDefaults as defaultSetEnvDefaults } from "@auth/core"
import { RemixAuthConfig } from "./types.js"


export function setEnvDefaults(
  envObject: any,
  config: RemixAuthConfig,
  suppressBasePathWarning = false
) {
    defaultSetEnvDefaults(envObject, config as AuthConfig, suppressBasePathWarning)
    config.adapter = typeof config.adapter === 'function' ? config.adapter(envObject) : config.adapter
}
