const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const mediaOrigin = import.meta.env.VITE_SERVER_URL || apiUrl.replace(/\/api\/?$/, "");

/*
 * DOCU: Builds the correct URL for uploaded images in local and production environments.
 */
export function mediaUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${mediaOrigin}${path.startsWith("/") ? path : `/${path}`}`;
}
