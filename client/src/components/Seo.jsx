import { useEffect } from "react";

const siteName = "Printix";

function upsertMeta(attribute, value, content) {
  let element = document.head.querySelector(`meta[${attribute}="${value}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function Seo({ title, description, image, path }) {
  useEffect(() => {
    const pageTitle = title ? `${title} | ${siteName}` : siteName;
    document.title = pageTitle;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", pageTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", `${window.location.origin}${path || window.location.pathname}`);
    upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", pageTitle);
    upsertMeta("name", "twitter:description", description);

    if (image) upsertMeta("property", "og:image", image);

    let canonical = document.head.querySelector("link[rel=canonical]");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}${path || window.location.pathname}`;
  }, [description, image, path, title]);

  return null;
}

export default Seo;