import { Auth, createActionURL } from "@auth/core";
import type { BuiltInProviderType, ProviderType } from "@auth/core/providers";
import type { Session, AuthConfig } from "@auth/core/types";
import {
    type ActionFunction,
    type ActionFunctionArgs,
    type LoaderFunction,
    type LoaderFunctionArgs,
    redirect,
} from "@remix-run/server-runtime";
import type { GetSessionResult, RemixAuthConfig } from "../lib/types.js";
import { getBasePath, setEnvDefaults } from "../lib/utils.js";

export const loader: (
    config: RemixAuthConfig,
    env: Record<string, string | undefined>,
) => LoaderFunction =
    (config, env) =>
    async ({ request, params }) => {
        await setEnvDefaults(env, config);
        config.basePath = getBasePath({ request, params });
        return await Auth(request, config as AuthConfig);
    };

export const action: (
    config: RemixAuthConfig,
    env: Record<string, string | undefined>,
) => ActionFunction =
    (config, env) =>
    async ({ request, params }) => {
        await setEnvDefaults(env, config);
        config.basePath = getBasePath({ request, params });
        return await Auth(request, config as AuthConfig);
    };

export const getCsrfToken: (
    config: RemixAuthConfig,
    env: Record<string, string | undefined>,
) => (
    args: Pick<LoaderFunctionArgs | ActionFunctionArgs, "request">,
) => Promise<Response> =
    (config, env) =>
    async ({ request }) => {
        await setEnvDefaults(env, config);
        const url = createActionURL(
            "csrf",
            request.headers.get("x-forwarded-proto") ??
                new URL(request.url).protocol,
            request.headers,
            env,
            config,
        );

        const response = await Auth(new Request(url), config as AuthConfig);

        if (!response.ok) {
            throw new Error((await response.json<Error>()).message);
        }
        return response;
    };

export const getSession: (
    config: RemixAuthConfig,
    env: Record<string, string | undefined>,
) => (
    args: Pick<LoaderFunctionArgs | ActionFunctionArgs, "request">,
) => GetSessionResult =
    (config, env) =>
    async ({ request }) => {
        await setEnvDefaults(env, config);
        const url = createActionURL(
            "session",
            request.headers.get("x-forwarded-proto") ??
                new URL(request.url).protocol,
            request.headers,
            env,
            config,
        );

        const response = await Auth(
            new Request(url, {
                headers: { cookie: request.headers.get("cookie") ?? "" },
            }),
            config as AuthConfig,
        );

        const { status = 200 } = response;

        const data = await response.json<Session | Error>();

        if (!data || !Object.keys(data).length) return null;
        if (status === 200) return data as Session;
        throw new Error((data as Error).message);
    };

export const signIn: (
    config: RemixAuthConfig,
    env: Record<string, string | undefined>,
) => (
    args: Pick<LoaderFunctionArgs | ActionFunctionArgs, "request">,
    options?: {
        provider?: BuiltInProviderType;
        authorizationParams?:
            | string[][]
            | Record<string, string>
            | string
            | URLSearchParams;
        redirectTo?: string;
    },
) => Promise<Response> =
    (config, env) =>
    async ({ request }, { provider, authorizationParams, redirectTo } = {}) => {
        await setEnvDefaults(env, config);
        const headers = new Headers(request.headers);

        const callbackUrl =
            redirectTo?.toString() ?? headers.get("Referer") ?? "/";
        const signInURL = createActionURL(
            "signin",
            headers.get("x-forwarded-proto") ?? new URL(request.url).protocol,
            headers,
            env,
            config,
        );

        if (!provider) {
            signInURL.searchParams.append("callbackUrl", callbackUrl);
            return redirect(signInURL.toString());
        }

        let url = `${signInURL}/${provider}?${new URLSearchParams(authorizationParams)}`;
        let foundProvider: { id?: BuiltInProviderType; type?: ProviderType } =
            {};

        for (const providerConfig of config.providers) {
            const { options, ...defaults } =
                typeof providerConfig === "function"
                    ? providerConfig()
                    : providerConfig;
            const id = (options?.id as string | undefined) ?? defaults.id;
            if (id === provider) {
                foundProvider = {
                    id,
                    type:
                        (options?.type as ProviderType | undefined) ??
                        defaults.type,
                };
                break;
            }
        }

        if (!foundProvider.id) {
            const url = `${signInURL}?${new URLSearchParams({ callbackUrl })}`;
            return redirect(url);
        }

        if (foundProvider.type === "credentials") {
            url = url.replace("signin", "callback");
        }

        headers.set("Content-Type", "application/x-www-form-urlencoded");
        const body = new URLSearchParams({
            ...Object.fromEntries(await request.formData()),
            callbackUrl,
        });
        const newReq = new Request(url, { method: "POST", headers, body });
        const res = await Auth(newReq, { ...(config as AuthConfig) });

        return res;
    };

export const signOut: (
    config: RemixAuthConfig,
    env: Record<string, string | undefined>,
) => (
    args: Pick<LoaderFunctionArgs | ActionFunctionArgs, "request">,
    options?: { redirectTo?: string },
) => Promise<Response> =
    (config, env) =>
    async ({ request }, options = {}) => {
        await setEnvDefaults(env, config);
        const headers = new Headers(request.headers);
        headers.set("Content-Type", "application/x-www-form-urlencoded");

        const url = createActionURL(
            "signout",
            headers.get("x-forwarded-proto") ?? new URL(request.url).protocol,
            headers,
            env,
            config,
        );
        const callbackUrl =
            options?.redirectTo ?? headers.get("Referer") ?? "/";
        const body = new URLSearchParams({
            ...Object.fromEntries(await request.formData()),
            callbackUrl,
        });
        const newReq = new Request(url, { method: "POST", headers, body });

        const res = await Auth(newReq, { ...(config as AuthConfig) });

        return res;
    };
