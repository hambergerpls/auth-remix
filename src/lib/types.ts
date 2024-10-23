import { AuthConfig } from "@auth/core"
import { Adapter } from "../adapters.js"
import { Awaitable } from "@auth/core/types"


export type RemixAuthConfig = Omit<AuthConfig, "raw" | "adapter"> & {
  adapter: Adapter | ( (env: unknown) => Awaitable<Adapter> )
}
