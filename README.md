# Lane Studio

Lane Studio is a browser-based annotation tool for gel and blot images. It lets you create and distribute lane regions, resize and move them, style their labels, and export the annotated result as a PNG.

## Features

- Upload any common image format without sending the image to a server
- Create up to 30 lanes at once or add them individually
- Drag, resize, evenly distribute, and equalize lane widths
- Edit labels, choose preset names, and set font, size, weight, italics, color, angle, and position
- Apply one lane's style to every lane
- Export the annotated image as a PNG
- Keyboard nudging and responsive controls

## Local development

```bash
pnpm install
pnpm dev
```

## Production build

```bash
pnpm build
```

Images are processed locally in the browser and are not uploaded by the application.
