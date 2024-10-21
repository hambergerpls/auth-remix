/** 
 * We export the loader and action function from RemixAuth at auth.$ route.
 * This acts as the /auth/<action>/<provider> endpoint for Auth.js
 * */
export { loader, action } from "~/lib/auth.server";

