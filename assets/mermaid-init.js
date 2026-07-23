/* Renders <pre class="mermaid"> diagram blocks in lessons.
   Load order (both deferred): ../assets/vendor/mermaid.min.js, then this file. */

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
});

mermaid.run({ querySelector: "pre.mermaid" });
