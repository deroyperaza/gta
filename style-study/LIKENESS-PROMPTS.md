# Likeness portraits: image-to-image prompts

The code-drawn portraits get hair and clothes right but drift toward a generic face. Getting real likenesses takes an image model that can see both the person's photo and the style reference.

**For each person, attach two images:**
1. `style-reference.png` (Farouk at the bodega counter, the Style A conversation scene)
2. The person's photo

Then paste the base prompt with their line filled in. Generate 2 or 3 and keep the closest one. Save it as `public/portraits/<name>.png` (4:5, at least 960×1200) and I'll crop, grade and swap it into the game.

## Base prompt

> Use the first image only as the style reference and the second image only as the likeness reference.
> Paint **[PERSON]** as a waist-up character portrait in exactly the style of the first image: ink-outlined illustration, painted gradients, stipple texture on hair and stubble, warm golden-hour light coming from the left, soft halftone in the shadows, slight film grain.
> Likeness matters most. Keep their face shape, eyes, nose, smile, hairline, hairstyle, glasses and facial hair faithful to the photo. Don't make them younger, thinner or more generic.
> They face the viewer, slightly turned, looking just left of camera. Background: a softly blurred Brooklyn brownstone stoop at sunset. Portrait orientation, 4:5, person centered with the head in the upper third. No text, no logos, no UI.

## Per-person lines

- **Deroy** (right in the kitchen photo, or right in the "We the People of Brooklyn" photo): wearing a cognac leather jacket over a cream "We The People of Brooklyn" tee in navy blackletter, round tortoiseshell glasses, short trimmed beard with grey at the chin, big grin.
- **Jenna** (left in the "We the People of Brooklyn" photo): green eyes, long dark-brown hair, blue-and-gold satin souvenir jacket with an embroidered gold bird over the cream "We The People of Brooklyn" tee, big smile.
- **Nell** (left in the kitchen photo): short dark hair with silver on top, swept up, white V-neck tee, wide grin.
- **Bridgette** (middle of the three on the couch): brown hair pulled back with a center part, stonewashed denim jumpsuit, thin gold necklaces, mint crossbody strap, big open smile.
- **Adrian** (soccer field photo): dark hair pulled back, sunglasses pushed up on his head, rimless glasses, full brown beard going grey at the chin, navy crew sweater under a black puffer vest, wry half smile. No lanyard or badge.
- **Danae** (second from right in the selfie, left in the photo with the girl): shoulder-length dark wavy hair with volume, hazel eyes, coral knit sweater, warm smile.
- **Jon** (Emmys photo): swept-back shoulder-length wavy salt-and-pepper hair, light blue eyes, short grey beard, black tuxedo with a black bow tie, big smile. No trophy.
