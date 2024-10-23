import { AuthConfig } from "@auth/core"
import { Adapter } from "../adapters.js"


export type RemixAuthConfig = Omit<AuthConfig, "raw" | "adapter"> & {
  adapter: Adapter | ( (env: unknown) => Adapter )
}
