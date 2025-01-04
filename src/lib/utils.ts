import { AuthConfig, setEnvDefaults as defaultSetEnvDefaults } from "@auth/core"
import { RemixAuthConfig } from "./types.js"
import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";


export async function setEnvDefaults(
  envObject: Record<string, string | undefined>,
  config: RemixAuthConfig,
  suppressBasePathWarning = false
) {
    defaultSetEnvDefaults(envObject, config as AuthConfig, suppressBasePathWarning)
    config.adapter = typeof config.adapter === 'function' ? await config.adapter(envObject) : config.adapter
}


export function getBasePath({ request, params }: Omit< LoaderFunctionArgs | ActionFunctionArgs, "context" >) {
  const url = new URL(request.url);
  const [ firstParams ] = Object.values( params )
  if (!firstParams) {
    throw new Error("Value of first params is undefined")
  }
  return url.pathname.split(firstParams[0])[0].replace(/\/$/, "")
}
