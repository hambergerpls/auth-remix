import { RemixAuth } from "../../src/cloudflare";
import Credentials from "@auth/core/providers/credentials";
import { describe, it, expect } from "vitest";
import { extractCookieValue } from "../utils";

const { loader, action, getSession, getCsrfToken, signIn, signOut } = RemixAuth(
    {
        secret: "secret",
        providers: [
            Credentials({
                id: "credentials",
                name: "Password",
                credentials: {
                    password: { label: "Password", type: "password" },
                },
                async authorize(credentials) {
                    if (credentials.password === "password") {
                        return {
                            email: "bob@alice.com",
                            name: "Bob Alice",
                            image: "https://avatars.githubusercontent.com/u/67470890?s=200&v=4",
                        };
                    }
                    if (credentials.password === "123") {
                        return {
                            email: "alice@bob.com",
                            name: "Alice Bob",
                            image: "https://avatars.githubusercontent.com/u/67470890?s=200&v=4",
                        };
                    }
                    return null;
                },
            }),
        ],
    },
);

describe("Integration test with login and getSession", () => {
    it("Should return the session with username after logging in", async () => {
        // Get signin page
        const response = (await loader({
            request: new Request("http://test/auth/signin", {
                headers: {
                    "X-Test-Header": "foo",
                    Accept: "application/json",
                },
            }),
            params: {
                action: "signin",
            },
            context: {
                cloudflare: {
                    env: {},
                },
            },
        })) as Response;

        // Parse cookies for csrf token and callback url
        const csrfTokenCookie = extractCookieValue(
            response.headers.getSetCookie(),
            "authjs.csrf-token",
        );
        const callbackCookie = extractCookieValue(
            response.headers.getSetCookie(),
            "authjs.callback-url",
        );
        const csrfTokenValue = csrfTokenCookie.split("%")[0].split("=")[1];

        const headers = new Headers();
        headers.append("Cookie", csrfTokenCookie);
        headers.append("Cookie", callbackCookie);
        headers.set("Content-Type", "application/json");
        const body = JSON.stringify({
            csrfToken: csrfTokenValue,
            password: "password",
        });

        // Sign in
        const responseCredentials = (await action({
            request: new Request("http://test/auth/callback/credentials", {
                method: "POST",
                headers,
                body,
            }),
            params: {
                action: "callback",
            },
            context: {
                cloudflare: {
                    env: {},
                },
            },
        })) as Response;

        // Parse cookie for session token
        const sessionTokenCookie = extractCookieValue(
            responseCredentials.headers.getSetCookie(),
            "authjs.session-token",
        );

        // Get session
        const session = await getSession({
            request: new Request("http://test", {
                headers: {
                    "X-Test-Header": "foo",
                    Accept: "application/json",
                    Cookie: sessionTokenCookie,
                },
            }),
            context: {
                cloudflare: {
                    env: {},
                },
            },
        });

        expect(session).not.toBe(null);
        expect(session?.user?.name).toEqual("Bob Alice");
    });
});
