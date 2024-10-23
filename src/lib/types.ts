import { AuthConfig } from "@auth/core"
import { Adapter } from "src/adapters.js"


export type RemixAuthConfig = Omit<AuthConfig, "raw" | "adapter"> & {
  adapter: Adapter | ( (env: unknown) => Adapter )
}
