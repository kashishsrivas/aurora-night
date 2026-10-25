# Aurora Night 🌌

Aurora Night is a quiet, one-page 3D web experience. A visitor enters an open landscape at night and sees a solitary seated woman from behind, looking toward a horizon beneath slow-moving Northern Lights. There are no menus, sections, or scrolling—only the landscape, the sky, and optional ambient sound.

## Experience

The website is designed to feel cinematic, calm, and immersive:

- `Aurora Night` appears quietly in the top-left corner.
- A female character sits nearly motionless on dark open ground.
- Mountains or hills form a distant, low-contrast horizon.
- The Northern Lights are the main focus: green, turquoise, blue, violet, and faint pink ribbons drift slowly through the night sky.
- A small sound control in the bottom-right lets visitors turn ambience on or off.
- The scene fills the whole browser window on desktop, tablet, and mobile.

## Recommended stack

| Area | Recommended technology |
| --- | --- |
| Page structure | HTML |
| Layout and interface styling | CSS |
| Controls and responsive behavior | JavaScript |
| 3D scene | Three.js |
| Aurora animation | GLSL shader or layered transparent 3D effects |
| 3D character and environment assets | GLB / glTF |
| Sound | Web Audio API or HTML Audio |
| Fonts | Cormorant Garamond for the title; Inter for controls |

## Scene design

The camera should be positioned behind and slightly above the seated woman, facing the horizon and wide sky. The woman, terrain, and mountains should remain still. Movement is deliberately limited to the aurora, faint star shimmer, optional slow particles, and very subtle camera parallax from mouse movement or phone tilt.

Use a deep night palette—near-black, midnight blue, charcoal, and dark purple—for the environment. The aurora should have a soft glow rather than sharp edges. Bloom, light fog, soft shadows, a star field, and restrained cool color grading help create depth without making the scene busy.

## Audio

The project currently includes `m. by anil emre` and `wind.mp3` as its music and environmental ambience. Audio must be muted when the page first opens; browsers expect visitors to choose when sound begins.

When a visitor selects **Sound On**, fade the selected music and wind ambience in gently over roughly one second. Start at a comfortable, low volume (around 30–40% for music, with wind kept quieter underneath). Fade both tracks out when sound is turned off, and loop them cleanly while the page remains open.

You may replace either audio file with any music or ambience that suits the experience. Before publishing, make sure you own the files or have the required permission or licence to use them online.

## Interface

Keep the interface intentionally minimal:

| Element | Text | Location |
| --- | --- | --- |
| Title | `Aurora Night` | Top-left |
| Audio control | `Sound On` / `Sound Off` | Bottom-right |
| Accessibility control | `Reduce motion` | Beside the audio control or within a compact settings control |
| Loading state | `Entering the night…` | Center; display only while assets load |

The title should use Cormorant Garamond in a soft, slightly transparent white. Controls should use Inter and have clear accessible labels.

## Accessibility and performance

- Provide a **Reduce motion** setting that slows or stops aurora, particle, and camera motion.
- Do not begin audio until the visitor activates it.
- Maintain accessible contrast for all visible text and controls.
- Use optimized, low-polygon GLB/glTF models and compressed textures.
- Lower star count, particles, and render quality automatically on lower-powered devices.
- Provide a lightweight fallback image or simplified animated background when WebGL or the full 3D scene is unavailable.
- Test the final composition on desktop and mobile to ensure the figure remains visible and the sky remains the focal point.

## Project goal

Aurora Night is not a traditional website with content to read or actions to complete. It is a small place to pause: one person, a silent landscape, a living sky, and the option to listen.

## Visit Aurora Night

[Explore Aurora Night](https://welcome-to-aurora-night.vercel.app/)

---
## Author

Kashish Srivastava
