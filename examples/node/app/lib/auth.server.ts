/**
 *  Ensure the current file name has `.server` in order to explicitly
 *  mark it that it should be server-side only.
 */

import Credentials from "auth-remix/providers/credentials";
import { RemixAuth } from "auth-remix/node";

/**
 *  We import { RemixAuth } and call the function with a provider and destructure the object returned.
 *  In this example, we use { Credentials } provider for a simple password-based authentication.
 *
 *  { loader } and { action } are handlers to be exported at `auth.$` route.
 *  { getSession } function is used to retrieve the current user's session.
 *  { getCsrfToken } function is used to retrieve csrfToken and set it in cookie.
 *  { signIn } is a function to sign in a user.
 *  { signOut } is a function to sign out a user.
 */
export const { loader, action, getSession, getCsrfToken, signIn, signOut } = RemixAuth({ 
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
          }
        }
        if (credentials.password === "123") {
          return {
            email: "alice@bob.com",
            name: "Alice Bob",
            image: "https://avatars.githubusercontent.com/u/67470890?s=200&v=4",
          }
        }
        return null;
      }
    })
  ]
});
