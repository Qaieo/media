# Qaieo quantum particle field

## Design

A coherent particle wave in warm ivory, slate and restrained ember on graphite. The wave occupies the right side and lower hero while an opaque gradient protects the newsletter copy. The former right-side editorial aside is removed; the same coverage appears in the existing coverage section. Approved logo, newsletter copy, article feed and Kit endpoint are preserved.

## Rendering and resilience

- Primary: locally served Higgsfield eight-second motion loop, muted, inline, no player controls or manual replay. H.264/yuv420p, 1440px wide, 30fps, fast-start MP4, about 1.4 MB; no audio stream.
- Generated poster: local 1600px WebP, about 122 KB. Visible before rendering and when reduced motion is requested. It also remains if canvas is unavailable.
- Fallback: phase-linked particle interference drawn in Canvas 2D. 8,436 desktop / 3,220 mobile particles before clipping, batched paint states, 30fps ceiling, DPR capped at 1.5.
- Actual decoded playback must advance before video is revealed. Autoplay rejection/media errors keep the canvas active. Stalled/waiting media restores it and must advance beyond the stalled frame before being shown again.
- Pause/resume affects both renderers. Offscreen or hidden documents pause rendering. Reduced motion makes no initial video request. Data-saving clients use the canvas without requesting video. No third-party runtime media calls.
- Pointer movement gently shifts the field; touch does not. The field is decorative, inaccessible to pointer events and hidden from the accessibility tree. Inputs remain opaque and keyboard focus is preserved.

This is an artistic quantum-wave metaphor, not a scientific simulation or measured physical data.

## Verification

`node site/build.mjs` and `node --test site/node-runtime.test.mjs site/frontier.test.mjs site/ripple.test.mjs site/subscribe.test.mjs` pass (21 checks). Motion tests cover real-progress gating, stale-frame rejection, autoplay/error fallback, buffering recovery, visibility/pause persistence, reduced motion, data saver and absent canvas. Actual IAB playback advances (`readyState=4`, `paused=false`); pause and resume verified. Desktop 1440px and mobile 390px/320px layout checks; no horizontal overflow.

Production remains pending the Kit account/form/credential connection and end-to-end confirmation check. No subscriber addresses were sent during this work.

## Higgsfield provenance

Concept model: GPT Image 2.5, maximum quality, 2K, 16:9.

Source image: https://d8j0ntlcm91z4.cloudfront.net/user_3KtYbXpKrOSUMT6824aQwICRjQF/hf_20261025_043814_fbe82e13-59ab-468f-ba19-18f7ca3330b2.png

Motion model: Seedance 2.5, 1080p, eight seconds, same image as start/end reference, no audio.

Source video: https://d8j0ntlcm91z4.cloudfront.net/user_3KtYbXpKrOSUMT6824aQwICRjQF/hf_20261025_044027_4148da0a-addb-4b04-89ce-7a72370b48c4.mp4

## Concept prompt

Qaieo quantum particle field, premium editorial technology website background. A mathematically coherent three-dimensional wave sheet formed exclusively of thousands of tiny discrete luminous particles, ordered along a fine lattice, two overlapping sinusoidal wave packets creating constructive and destructive interference. A dramatic rolling silver crest rises diagonally through the right half then curls gently into deep graphite, generous almost-black negative space occupying the left 43 percent for a large headline. Macro photography precision, computational sculpture, warm ivory pinpoints and very sparse ember orange #f16b3d particles traveling on one ridge, desaturated slate in distant particles. Background #080a0c. Strong depth, restrained atmospheric bloom, razor sharp medium-distance dots, subtly defocused far field. Composition spans edge to edge across a widescreen landscape. The field is an elegant continuous topology, not a galaxy or random starfield, no connected wireframe lines, no torus, no glowing rings, no neon rainbow, no purple, no blue holographic UI, no labels, no text, no logo, no interface. High-end generative computational art for an industrial science publication. Calm, intelligent, tactile, distinctive. Every point should remain individually legible. Bright ridge with a warm metallic ivory core and a few orange photons. Picture the sculpture occupying right 60 percent and lower-right edge, black left side is functional negative space. Wide hero asset, 16:9.

## Motion prompt

Animate this exact computational particle sculpture as a seamless eight-second website background loop. Locked camera. Thousands of individually visible warm silver particles form a single coherent three-dimensional wave sheet on graphite black. The existing wave crest travels smoothly through the lattice while a secondary counter-wave creates slow interference. Sparse ember-orange points glide along one contour. Very subtle depth-of-field and restrained bloom. Maintain the exact composition, empty left 43 percent for text, black background, ivory and ember palette. Constant particle count, no bursts, no cuts, no zoom, no text, no logos, no sound, no camera movement. One calm breathing cycle returning naturally to the starting phase, cinematic refined generative art, visually readable as a field of distinct particles rather than ribbons or solid fabric.
