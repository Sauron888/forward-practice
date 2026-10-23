# Design: Forward

## World
Bento grid on a warm grey ground. Each tile is one job (a subject, settings, history, a step). Quiz screens are an exam paper: white, black ink, squared options.

## Colour
- Thammasat red #C3002F: brand tile, hero, score tile.
- Gold #FFD13F and orange #F2A73C: subject tiles, buttons, selected states.
- Oxblood #7A0019 and ink #2A0B12: contrast tiles and all body text.
- Sky #00A1DF: landing CTA and start button only.
- Ground #F3EEEA, tile #FFFFFF. Quiz: #000 on #FFF only; chart bars #F2A73C.

## Type
- Headings: Prompt 600-700. Body: Noto Sans Thai. Exam stem and passage: Noto Serif Thai. Numerals tabular.

## Layout
- 12-column grid, 14px gap, 22px tile radius, max width 1180px. Tiles collapse to one column under 900px.
- Landing, home, preparing, between-subject and result screens share the tile system. Quiz uses the exam paper layout.

## Motion
- One authored moment: landing tiles rise in with a short stagger. Everything else answers a press (bubble fill, button depress). Reduced motion removes both.

## Rules
- No eyebrow labels, no gradient text, no coloured left borders, no glow shadows, no emoji.
- Browser surfaces (selection, caret, scrollbar, accent-color) take palette colours; in exam mode they are black.
