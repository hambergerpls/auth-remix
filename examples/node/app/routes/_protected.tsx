import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { getSession } from "~/lib/auth.server";

/**
 *  The `_protected` layout acts as a protected shell that fetches
 *  the current user from the current session. We can redirect the
 *  user to a sign-in page if the user is not logged in, else we
 *  return the user data which is accessible by the children.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getSession(request);
  if (!user || !user.user) {
    return redirect(`/signin?redirectTo=${request.url}`);
  }
  return json({ user: user.user })
}

export default function ProtectedPage() {
  return <Outlet />
}
