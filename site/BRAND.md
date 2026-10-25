# Qaieo website branding

Use the approved outlined logo in `logos/qaieo-logo-white.svg` on this dark site.
The artwork comes from the shared 25 October 2026 logo kit and includes its
own lettering. Do not retype the wordmark or substitute a font for it.

The shared header uses a 32px logo canvas height with proportional width at
all desktop and mobile widths. The home link has 8px padding around the asset
and a minimum 44px target (48px total with the logo and padding). These values
are the `--brand-logo-height` and `--brand-clear-space` CSS tokens.

Ordinary UI and reading text use the existing self-hosted Geist variable font.
Technical labels and data use Geist Mono. The bundled SIL Open Font License is
in `fonts/LICENSE.txt`. The logo lettering is independent of these text fonts.

Edit `build.mjs` and `style.css`, then run `node site/build.mjs` with the supported
Node runtime. All published pages use that shared template. Keep the generated
`site/public/` files in sync. Check the logo, hit area, loaded font, and horizontal
overflow at desktop and narrow mobile widths before publication.
