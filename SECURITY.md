# Security notes (27 Nov 2026)

- Every page sets a Content-Security-Policy (meta tag): no plugins (`object-src 'none'`), `base-uri 'self'`, `form-action 'self'`, scripts only from this site and the accessibility widget (negishot.co.il).
- Model and user text is rendered as text nodes, never as HTML. The only `innerHTML` uses insert fixed, built-in SVG icons.
- A secret scan with the gitleaks open-source rule set (github.com/gitleaks/gitleaks) over the current files and full git history found no real keys or tokens; all hits were storage-key names and test strings.
- Personal data stays in the browser (localStorage). AI calls go only through the consent gate (MomentumAIConsent) to the existing proxy.
- Icons: Lucide (ISC licence, lucide-LICENSE.txt). Font: Liberation Sans subset (OFL, momentum-sans-OFL.txt).
