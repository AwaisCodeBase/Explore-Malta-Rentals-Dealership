import Script from "next/script";

const STRIP_FDPROCESSEDID_SCRIPT = `
(function () {
  var name = "fdprocessedid";
  function strip(el) {
    if (!(el instanceof Element)) return;
    if (el.hasAttribute(name)) el.removeAttribute(name);
    el.querySelectorAll("[" + name + "]").forEach(function (node) {
      node.removeAttribute(name);
    });
  }
  strip(document.documentElement);
  new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      if (mutations[i].type === "attributes") strip(mutations[i].target);
    }
  }).observe(document.documentElement, {
    subtree: true,
    attributes: true,
    attributeFilter: [name],
  });
})();
`;

/**
 * Strips `fdprocessedid` injected by browser extensions (form fillers, etc.)
 * before React hydrates, preventing hydration mismatch noise in dev.
 */
export function StripFdprocessedId() {
  return (
    <Script id="strip-fdprocessedid" strategy="beforeInteractive">
      {STRIP_FDPROCESSEDID_SCRIPT}
    </Script>
  );
}
