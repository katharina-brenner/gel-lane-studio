# Lane Studio

Lane editor for gel and blot images.

## Features

- Local image upload
- Crop images independently from the top, right, bottom, and left using values or draggable crop handles
- 1–30 lanes
- Move, resize in both directions, rotate, and distribute lane boxes
- Auto-fit all lane boxes to an even grid in one click
- Copy one lane box's width, height, and angle to all lanes
- Drag labels freely or enter exact X/Y coordinates
- Label, font, size, weight, italics, color, angle, position
- PNG, JPEG, and SVG export

## Local development

```bash
pnpm install
pnpm dev
```

## Production build

```bash
pnpm build
```

Image processing stays in the browser.
