/**
 * Free sample images for first-run projects, new slides and the slide editor's picker.
 * Hot-linked from Lorem Picsum (https://picsum.photos), a free placeholder service that serves Unsplash photography —
 * no key, no signup. Swap them for your own images any time (URL or upload).
 */
export type Sample = { id: number; label: string; eyebrow: string; title: string; body: string; color: string; accent: string };

export const sampleUrl = (id: number, w = 1200, h = 900) => `https://picsum.photos/id/${id}/${w}/${h}`;

export const SAMPLES: Sample[] = [
  { id: 1015, label: 'River valley', eyebrow: 'FIELD NOTES / 01', title: 'Quiet hours by the river.', body: 'A study in slow light and the space between trees.', color: '#34455a', accent: '#c6dbd1' },
  { id: 1016, label: 'Red canyon', eyebrow: 'FIELD NOTES / 02', title: 'Red earth, long shadows.', body: 'Carved over a very long time, seen in a single glance.', color: '#4d3a32', accent: '#e2b78a' },
  { id: 1018, label: 'Green hills', eyebrow: 'FIELD NOTES / 03', title: 'Wide open country.', body: 'Soft ridgelines rolling out toward the horizon.', color: '#354d49', accent: '#bcd9c3' },
  { id: 1019, label: 'Aerial view', eyebrow: 'FIELD NOTES / 04', title: 'The view from above.', body: 'A new perspective on the places we thought we knew.', color: '#3a4458', accent: '#cfd8e6' },
  { id: 1035, label: 'Falling water', eyebrow: 'FIELD NOTES / 05', title: 'Where the water turns.', body: 'Movement you can hear before you see it.', color: '#2f4650', accent: '#a9d3d8' },
  { id: 1036, label: 'Snow peaks', eyebrow: 'FIELD NOTES / 06', title: 'High country, thin air.', body: 'Cold light on the edges of the map.', color: '#3b4558', accent: '#dbe4f2' },
  { id: 1039, label: 'Long falls', eyebrow: 'FIELD NOTES / 07', title: 'Make room for wonder.', body: 'A small detail that changes the whole scene.', color: '#2e4a44', accent: '#b4dccb' },
  { id: 1040, label: 'Old stones', eyebrow: 'FIELD NOTES / 08', title: 'Built to be remembered.', body: 'Craft that outlasts the people who made it.', color: '#4a4538', accent: '#d7c9aa' },
  { id: 1043, label: 'Still lake', eyebrow: 'FIELD NOTES / 09', title: 'Still water, clear sky.', body: 'The quiet hour before the day begins.', color: '#35475a', accent: '#c4d6e8' },
  { id: 1044, label: 'Open field', eyebrow: 'FIELD NOTES / 10', title: 'Form follows feeling.', body: 'A collection made to be seen differently.', color: '#4c4a36', accent: '#e0d6a4' },
  { id: 1047, label: 'City canal', eyebrow: 'FIELD NOTES / 11', title: 'Light on the waterline.', body: 'Evening arrives one reflection at a time.', color: '#4c3947', accent: '#d4b7c8' },
  { id: 1050, label: 'Far country', eyebrow: 'FIELD NOTES / 12', title: 'Somewhere past the ridge.', body: 'An invitation to keep going a little longer.', color: '#3e4b4d', accent: '#c2d6d8' },
];

/** Slide copy + image for the Nth slide, cycling through the sample set. */
export function sampleSlideFields(index: number) {
  const s = SAMPLES[((index % SAMPLES.length) + SAMPLES.length) % SAMPLES.length];
  return { name: `Slide ${String(index + 1).padStart(2, '0')}`, eyebrow: s.eyebrow, title: s.title, body: s.body, image: sampleUrl(s.id), color: s.color, accent: s.accent };
}
