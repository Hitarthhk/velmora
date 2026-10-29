# The Sound of the Valley: audio asset manifest

Engine: `src/components/sound/soundscape.ts` (one Web Audio graph for the whole site). Control: `src/components/sound/SoundToggle.tsx`, mounted once in the root layout. Credits: `soundCredits` in `src/content/site.ts`, shown under **Sound credits** in the footer.

## Status

The architecture is complete and tested, and it plays **licensed stand-in recordings** that are installed in `public/media/audio/`. **None of them was recorded in Solan.** Each is labelled by its real location. For launch, genuine Solan-region field recordings should replace them (see **Recordings to commission**). Swapping a file needs no code change, provided the filename stays the same; then re-measure its loudness trim (see **Levels**).

## Installed recordings

| File (`public/media/audio/`) | Layer | Recording | Recorded at | Author | Licence | Length |
| --- | --- | --- | --- | --- | --- | --- |
| `wind-woodland.mp3` | `wind` | Wind in woodland | Bourne Woods, England | Robert EA Harvey | CC BY-SA 4.0 | 57.6 s |
| `wind-pines.mp3` | `pines` | Wind in a pine forest | Lysekil, Sweden | W.carter | CC BY-SA 4.0 | 60.5 s |
| `dawn-foothills.mp3` | `dawn` | Dawn soundscape, 400 m | Pathari Forest Range, Haridwar, Uttarakhand | Taukeer Alam Lodha | CC BY-SA 4.0 | 24.7 s |
| `call-laughingthrush.mp3` | occasional calls | Streaked laughingthrush | Shimla, Himachal Pradesh | Shyamal | CC BY 4.0 | 30.2 s |
| `call-barbet.mp3` | occasional calls | Great barbet | Munsiyari, Uttarakhand | L. Shyamal | CC BY-SA 3.0 | 4.3 s |

All are from Wikimedia Commons (source pages are linked in `soundCredits`). They are Commons' MP3 versions, so they decode in Safari and iOS as well as in Chrome and Firefox. CC BY and CC BY-SA require visible attribution, which the footer provides. Adaptations (looping, layering and mixing) of the CC BY-SA files remain CC BY-SA.

The **tonal bed** (bottle showcase) and the **air texture** (collection) are synthesized in the browser. They imitate nothing in nature and need no files.

## Scenes

Sections declare their atmosphere with `data-soundscape`. The section crossing the middle of the screen sets the scene; volumes crossfade over a few seconds.

| Scene | Where | Mix |
| --- | --- | --- |
| `hero` | Homepage opening | Soft wind, pines, distant dawn birds, occasional calls |
| `showcase` | Once the bottle starts to rise | Deeper wind (low-pass ~620 Hz), birds recede, restrained tonal bed |
| `collection` | Once the collection is visible | Nature hushed, delicate air texture, faint tone |
| `forest` | Our Origin (homepage) and the whole Our Story page | Fuller forest: birds, pines, wind, frequent calls |
| `breeze` | Homepage Contact, the footer and all other pages | The gentle mountain air of the opening |

On first start it rises from silence: the breeze first, then the birds about 3 s later, then the pines at about 5.5 s.

## Behaviour

- Muted by default. Audio is created and downloaded only after the visitor turns it on (about 4.3 MB).
- The preference is remembered (`localStorage` key `gv-sound`). A returning visitor who left sound on hears it resume at their **first tap or key press**, usually the age gate's "Yes". It never autoplays audibly.
- It continues across page navigation. When the tab is hidden it fades out and suspends the audio device, and resumes on return.
- Loops are built from overlapping, crossfaded takes from random offsets, so there are no clicks at the seam and short recordings repeat far less obviously. Bird calls play as short phrases at random times (every 9–26 s) and random stereo positions, filtered to sound distant.
- A gentle limiter prevents clipping. The engine is plain TypeScript created once, so re-renders never restart playback, and it doesn't touch Three.js, Motion or the scroll animations.

## Levels

Each file is trimmed to a common −26 dBFS RMS (measured from the decoded audio) in `FILES` in `soundscape.ts`. When replacing a file, measure its RMS and set `trim = 10^((−26 − RMS) / 20)`.

## Recordings to commission (genuine Solan region)

| Filename | Content | Recommended length | Notes |
| --- | --- | --- | --- |
| `wind-woodland.mp3` | Soft wind through mixed hill forest, no birds dominant | 90–180 s | Calm morning; no traffic, voices or handling noise |
| `wind-pines.mp3` | Breeze through chir pine / deodar canopy (needle "hiss") | 90–180 s | Gentle, not storm wind |
| `dawn-foothills.mp3` | Dawn chorus in the Solan hills (e.g. near the Gambhar valley) | 120–300 s | The main bird bed; distant rather than close birds |
| `call-*.mp3` | Single species calls, e.g. great barbet, Himalayan bulbul, streaked laughingthrush, verditer flycatcher | 5–30 s each | Add files and list them in `FILES.calls` |

Recording: WAV 48 kHz/24-bit masters. Deliver as stereo MP3 (VBR around 160 kbps) or AAC (`.m4a`) for the web, with loop-friendly ends (no fades needed; the engine crossfades). **Licence:** commissioned work, or CC0/CC BY/CC BY-SA or royalty-free with commercial web use. **Avoid NC (non-commercial) licences**, which rules out most xeno-canto and many Freesound files. Record the author, licence, location and date for each in `soundCredits`.
