# Qaieo quantum particle field

## Design

A coherent particle wave in hard polished antique gold and smoky champagne on graphite. Orange accents have been replaced throughout the active UI, including CTA gradients and hover states. The wave occupies the right side and lower hero while an opaque gradient protects the newsletter copy. The former right-side editorial aside is removed; the same coverage appears in the existing coverage section. Approved logo, newsletter copy, article feed and Kit endpoint are preserved.

## Rendering and resilience

- Primary: locally served Higgsfield eight-second motion loop, muted, inline, no player controls or manual replay. H.264/yuv420p, 1440px wide, 30fps, fast-start MP4, about 2.0 MB; no audio stream.
- Generated poster: local 1600px WebP, about 151 KB. Visible before rendering and when reduced motion is requested. It also remains if canvas is unavailable.
- Fallback: phase-linked particle interference drawn in Canvas 2D. 8,436 desktop / 3,220 mobile particles before clipping, batched paint states, 30fps ceiling, DPR capped at 1.5.
- Actual decoded playback must advance before video is revealed. Autoplay rejection/media errors keep the canvas active. Stalled/waiting media restores it and must advance beyond the stalled frame before being shown again.
- Pause/resume affects both renderers. Offscreen or hidden documents pause rendering. Reduced motion makes no initial video request. Data-saving clients use the canvas without requesting video. No third-party runtime media calls.
- Pointer movement eases the field toward the cursor, locally bends particle coordinates and raises a soft gold reflection. A sparse live particle overlay remains interactive over the film, fades on pointer leave, and stops its frame loop after settling. Touch does not trigger it. The field is decorative, inaccessible to pointer events and hidden from the accessibility tree. Inputs remain opaque and keyboard focus is preserved.

This is an artistic quantum-wave metaphor, not a scientific simulation or measured physical data.

## Verification

`node site/build.mjs` and `node --test site/node-runtime.test.mjs site/frontier.test.mjs site/ripple.test.mjs site/subscribe.test.mjs` pass (25 checks). Motion tests cover real-progress gating, stale-frame rejection, autoplay/error fallback, buffering recovery, visibility/pause persistence, reduced motion, data saver and absent canvas. Actual IAB playback advances (`readyState=4`, `paused=false`); pause and resume verified. Desktop 1440px and mobile 390px/320px layout checks; no horizontal overflow.

Production remains pending the Kit account/form/credential connection and end-to-end confirmation check. No subscriber addresses were sent during this work.

## Higgsfield provenance — polished gold revision

Concept model: GPT Image 2.5, maximum quality, 2K, 16:9. Refines the prior composition in hardened antique gold.

Source image: https://d8j0ntlcm91z4.cloudfront.net/user_3KtYbXpKrOSUMT6824aQwICRjQF/hf_20261025_044951_2fcfb3f3-ae23-4fca-bbd9-2ea8b631ed2d.png

Motion model: Seedance 2.5, 1080p, eight seconds, same gold image as start/end reference, no audio.

Source video: https://d8j0ntlcm91z4.cloudfront.net/user_3KtYbXpKrOSUMT6824aQwICRjQF/hf_20261025_045152_a21804d5-ef3f-41b7-bc34-0acf98c6f08c.mp4

## Concept prompt

Refine the attached Qaieo quantum particle-wave hero into hardened dark polished gold. Keep exactly the composition, ordered particle-wave topology, black negative space on the left for text, and flowing diagonal crest on the right. Replace ALL orange/copper/ember particles and cool silver lighting with deep antique gold, smoky champagne, blackened gold and tiny pale-gold specular highlights. The material is hard, polished metal: brushed obsidian-gold particles with crisp reflections, deep near-black shadows, directional studio light, measured gloss. Palette #080a0c, #6e572f, #ae8d50, #d0b575, #f1e4be. Sophisticated luxury science publication, not bright yellow, not orange, not bronze glow. A denser dark metallic core fading into sparse crisp particles, glinting golden wave crests with subtle depth-of-field. Retain the calm visual restraint and functional negative space. No text, no logos, no UI, no rainbow. High-fidelity web hero art.

## Motion prompt

Create a seamless eight-second background loop from this exact dark polished GOLD particle wave. Camera stays completely locked. Dense, individually visible hard metallic gold particles arranged in a smooth quantum interference surface: slow traveling crests, deep near-black troughs and fine champagne specular reflections moving over rigid gold beads. The particle field gently breathes and drifts with one phase cycle; keep left forty-three percent almost black for headline copy. Color strictly blackened antique gold, smoky champagne, pale gold highlights and graphite black. Absolutely no orange, no copper, no fiery or amber light, no silver/blue lighting. Match the reference structure and exact lighting density. Restrained gloss, physically hard polished metal, high-end scientific editorial animation. No explosive glitter, no flashing, no cuts, no zoom, no text, no logos, no audio. Return continuously to the first phase for a seamless loop.
