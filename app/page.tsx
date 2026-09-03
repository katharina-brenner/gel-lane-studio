'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignHorizontalDistributeCenter,
  Bold,
  Download,
  Equal,
  GripVertical,
  ImagePlus,
  Italic,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  Upload,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';

type LabelPosition = 'top' | 'inside' | 'bottom';
type ExportFormat = 'png' | 'jpeg' | 'svg';

type Lane = {
  id: number;
  label: string;
  left: number;
  width: number;
  color: string;
  labelColor: string;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  rotation: number;
  labelPosition: LabelPosition;
  labelX: number;
  labelY: number;
};

type DragState = {
  id: number;
  mode: 'move' | 'resize-left' | 'resize-right';
  startX: number;
  startLeft: number;
  startWidth: number;
  startLabelX: number;
  stageWidth: number;
};

type LabelDragState = {
  id: number;
  startX: number;
  startY: number;
  startLabelX: number;
  startLabelY: number;
  stageWidth: number;
  stageHeight: number;
};

const LABEL_Y: Record<LabelPosition, number> = {
  top: -7,
  inside: 6,
  bottom: 107,
};

const INITIAL_LANES: Lane[] = [
  { id: 1, left: 5, width: 8.8, label: 'Marker', color: '#0b5fa5', labelColor: '#063f73', fontSize: 17, fontFamily: 'Manrope', bold: true, italic: false, rotation: -45, labelPosition: 'top', labelX: 9.4, labelY: -7 },
  { id: 2, left: 15, width: 8.8, label: 'Control', color: '#0b5fa5', labelColor: '#063f73', fontSize: 17, fontFamily: 'Manrope', bold: true, italic: false, rotation: -45, labelPosition: 'top', labelX: 19.4, labelY: -7 },
  { id: 3, left: 25, width: 8.8, label: 'Sample A', color: '#0b5fa5', labelColor: '#063f73', fontSize: 17, fontFamily: 'Manrope', bold: true, italic: false, rotation: -45, labelPosition: 'top', labelX: 29.4, labelY: -7 },
  { id: 4, left: 35, width: 8.8, label: 'Sample B', color: '#0b5fa5', labelColor: '#063f73', fontSize: 17, fontFamily: 'Manrope', bold: true, italic: false, rotation: -45, labelPosition: 'top', labelX: 39.4, labelY: -7 },
  { id: 5, left: 45, width: 8.8, label: 'Sample C', color: '#0b5fa5', labelColor: '#063f73', fontSize: 17, fontFamily: 'Manrope', bold: true, italic: false, rotation: -45, labelPosition: 'top', labelX: 49.4, labelY: -7 },
  { id: 6, left: 55, width: 8.8, label: 'Treatment 1', color: '#0b5fa5', labelColor: '#063f73', fontSize: 17, fontFamily: 'Manrope', bold: true, italic: false, rotation: -45, labelPosition: 'top', labelX: 59.4, labelY: -7 },
  { id: 7, left: 65, width: 8.8, label: 'Treatment 2', color: '#bb2d3b', labelColor: '#9d1f2d', fontSize: 17, fontFamily: 'Manrope', bold: true, italic: false, rotation: -45, labelPosition: 'top', labelX: 69.4, labelY: -7 },
  { id: 8, left: 75, width: 8.8, label: 'Treatment 3', color: '#0b5fa5', labelColor: '#063f73', fontSize: 17, fontFamily: 'Manrope', bold: true, italic: false, rotation: -45, labelPosition: 'top', labelX: 79.4, labelY: -7 },
  { id: 9, left: 85, width: 8.8, label: 'Treatment 4', color: '#0b5fa5', labelColor: '#063f73', fontSize: 17, fontFamily: 'Manrope', bold: true, italic: false, rotation: -45, labelPosition: 'top', labelX: 89.4, labelY: -7 },
];

const FONT_STACKS: Record<string, string> = {
  Manrope: 'Manrope, Arial, sans-serif',
  Arial: 'Arial, sans-serif',
  Georgia: 'Georgia, serif',
  'Times New Roman': '"Times New Roman", serif',
  'Courier New': '"Courier New", monospace',
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function alpha(hex: string, opacity: number) {
  const clean = hex.replace('#', '');
  const value = Number.parseInt(clean.length === 3 ? clean.split('').map((part) => part + part).join('') : clean, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  }[character] ?? character));
}

function drawDemoGel(canvas: HTMLCanvasElement) {
  const width = 1200;
  const height = 720;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return;

  context.fillStyle = '#efeee9';
  context.fillRect(0, 0, width, height);
  const wash = context.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, 'rgba(255,255,255,.92)');
  wash.addColorStop(0.48, 'rgba(178,183,187,.28)');
  wash.addColorStop(1, 'rgba(255,255,255,.78)');
  context.fillStyle = wash;
  context.fillRect(0, 0, width, height);

  const laneCenters = [110, 230, 350, 470, 590, 710, 830, 950, 1070];
  laneCenters.forEach((x, laneIndex) => {
    const laneGlow = context.createLinearGradient(x - 52, 0, x + 52, 0);
    laneGlow.addColorStop(0, 'rgba(8,15,28,0)');
    laneGlow.addColorStop(0.5, `rgba(8,15,28,${0.07 + (laneIndex % 4) * 0.027})`);
    laneGlow.addColorStop(1, 'rgba(8,15,28,0)');
    context.fillStyle = laneGlow;
    context.fillRect(x - 58, 42, 116, 625);

    const bands = laneIndex === 0 ? [108, 170, 242, 322, 414, 516, 604] : [138, 204, 262, 318, 380, 452, 526, 604];
    bands.forEach((y, bandIndex) => {
      const opacity = laneIndex === 0 ? 0.2 : 0.14 + ((laneIndex * 2 + bandIndex) % 5) * 0.055;
      const bandWidth = 35 + ((laneIndex * 23 + bandIndex * 17) % 35);
      const band = context.createLinearGradient(x - bandWidth, y, x + bandWidth, y);
      band.addColorStop(0, 'rgba(8,15,28,0)');
      band.addColorStop(0.22, `rgba(8,15,28,${opacity * 0.65})`);
      band.addColorStop(0.5, `rgba(8,15,28,${opacity})`);
      band.addColorStop(0.78, `rgba(8,15,28,${opacity * 0.65})`);
      band.addColorStop(1, 'rgba(8,15,28,0)');
      context.fillStyle = band;
      context.fillRect(x - bandWidth, y - 7, bandWidth * 2, 12 + ((bandIndex + laneIndex) % 3) * 3);
    });
  });

  const vignette = context.createRadialGradient(width / 2, height / 2, 120, width / 2, height / 2, width * 0.7);
  vignette.addColorStop(0, 'rgba(255,255,255,0)');
  vignette.addColorStop(1, 'rgba(17,24,39,.08)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
}

export default function Home() {
  const demoCanvasRef = useRef<HTMLCanvasElement>(null);
  const uploadedImageRef = useRef<HTMLImageElement>(null);
  const gelMediaRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const labelDragRef = useRef<LabelDragState | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const nextIdRef = useRef(10);

  const [lanes, setLanes] = useState<Lane[]>(INITIAL_LANES);
  const [selectedId, setSelectedId] = useState(7);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 1200, height: 720 });
  const [projectName, setProjectName] = useState('Demo gel');
  const [laneCount, setLaneCount] = useState(9);
  const [status, setStatus] = useState('Demo');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');

  const selectedLane = useMemo(() => lanes.find((lane) => lane.id === selectedId) ?? null, [lanes, selectedId]);

  useEffect(() => {
    if (!imageUrl && demoCanvasRef.current) drawDemoGel(demoCanvasRef.current);
  }, [imageUrl]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  function updateLane(id: number, patch: Partial<Lane>) {
    setLanes((current) => current.map((lane) => lane.id === id ? { ...lane, ...patch } : lane));
  }

  function createLaneGrid(count = laneCount) {
    const safeCount = clamp(Math.round(count), 1, 30);
    const margin = 4;
    const gap = safeCount > 1 ? Math.min(1.3, 12 / safeCount) : 0;
    const width = (100 - margin * 2 - gap * (safeCount - 1)) / safeCount;
    const freshLanes = Array.from({ length: safeCount }, (_, index): Lane => {
      const left = margin + index * (width + gap);
      return {
        id: nextIdRef.current++,
        label: index === 0 ? 'Marker' : `Lane ${index + 1}`,
        left,
        width,
        color: '#0b5fa5',
        labelColor: '#063f73',
        fontSize: 17,
        fontFamily: 'Manrope',
        bold: true,
        italic: false,
        rotation: safeCount > 7 ? -45 : 0,
        labelPosition: 'top',
        labelX: left + width / 2,
        labelY: LABEL_Y.top,
      };
    });
    setLanes(freshLanes);
    setSelectedId(freshLanes[0].id);
    setLaneCount(safeCount);
    setStatus(`${safeCount} lanes`);
  }

  function addLane() {
    const width = selectedLane?.width ?? 8;
    const occupiedRight = lanes.reduce((maximum, lane) => Math.max(maximum, lane.left + lane.width), 0);
    const left = occupiedRight + 1.5 + width <= 98 ? occupiedRight + 1.5 : clamp(50 - width / 2, 0, 100 - width);
    const lane: Lane = {
      id: nextIdRef.current++,
      label: `Lane ${lanes.length + 1}`,
      left,
      width,
      color: selectedLane?.color ?? '#0b5fa5',
      labelColor: selectedLane?.labelColor ?? '#063f73',
      fontSize: selectedLane?.fontSize ?? 17,
      fontFamily: selectedLane?.fontFamily ?? 'Manrope',
      bold: selectedLane?.bold ?? true,
      italic: selectedLane?.italic ?? false,
      rotation: selectedLane?.rotation ?? 0,
      labelPosition: selectedLane?.labelPosition ?? 'top',
      labelX: left + width / 2,
      labelY: LABEL_Y[selectedLane?.labelPosition ?? 'top'],
    };
    setLanes((current) => [...current, lane]);
    setSelectedId(lane.id);
    setLaneCount(lanes.length + 1);
    setStatus('Added');
  }

  function deleteLane(id = selectedId) {
    setLanes((current) => {
      const next = current.filter((lane) => lane.id !== id);
      setSelectedId(next[0]?.id ?? -1);
      setLaneCount(next.length || 1);
      return next;
    });
    setStatus('Removed');
  }

  function distributeLanes() {
    if (lanes.length < 2) return;
    const sorted = [...lanes].sort((a, b) => a.left - b.left);
    const start = sorted[0].left + sorted[0].width / 2;
    const end = sorted.at(-1)!.left + sorted.at(-1)!.width / 2;
    const spacing = (end - start) / (sorted.length - 1);
    const positions = new Map(sorted.map((lane, index) => [lane.id, clamp(start + index * spacing - lane.width / 2, 0, 100 - lane.width)]));
    setLanes((current) => current.map((lane) => {
      const left = positions.get(lane.id) ?? lane.left;
      return { ...lane, left, labelX: clamp(lane.labelX + left - lane.left, -20, 120) };
    }));
    setStatus('Distributed');
  }

  function equalizeWidths() {
    if (!lanes.length) return;
    const width = lanes.reduce((sum, lane) => sum + lane.width, 0) / lanes.length;
    setLanes((current) => current.map((lane) => {
      const nextWidth = Math.min(width, 100 - lane.left);
      return { ...lane, width: nextWidth, labelX: clamp(lane.labelX + (nextWidth - lane.width) / 2, -20, 120) };
    }));
    setStatus('Widths matched');
  }

  function resetDemo() {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setImageUrl(null);
    setImageSize({ width: 1200, height: 720 });
    setProjectName('Demo gel');
    setLanes(INITIAL_LANES);
    setSelectedId(7);
    setLaneCount(9);
    setStatus('Demo');
  }

  function handleUpload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus('Choose an image');
      return;
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImageUrl(url);
    setProjectName(file.name.replace(/\.[^.]+$/, ''));
    setStatus('Image loaded');
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>, lane: Lane) {
    const target = event.target as HTMLElement;
    const mode = (target.dataset.mode as DragState['mode'] | undefined) ?? 'move';
    const bounds = gelMediaRef.current?.getBoundingClientRect();
    if (!bounds) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(lane.id);
    dragRef.current = { id: lane.id, mode, startX: event.clientX, startLeft: lane.left, startWidth: lane.width, startLabelX: lane.labelX, stageWidth: bounds.width };
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id !== Number(event.currentTarget.dataset.laneId)) return;
    const delta = ((event.clientX - drag.startX) / drag.stageWidth) * 100;
    if (drag.mode === 'move') {
      const left = clamp(drag.startLeft + delta, 0, 100 - drag.startWidth);
      updateLane(drag.id, { left, labelX: clamp(drag.startLabelX + left - drag.startLeft, -20, 120) });
    } else if (drag.mode === 'resize-left') {
      const left = clamp(drag.startLeft + delta, 0, drag.startLeft + drag.startWidth - 1.5);
      const width = drag.startWidth + drag.startLeft - left;
      const centerShift = left + width / 2 - (drag.startLeft + drag.startWidth / 2);
      updateLane(drag.id, { left, width, labelX: clamp(drag.startLabelX + centerShift, -20, 120) });
    } else {
      const width = clamp(drag.startWidth + delta, 1.5, 100 - drag.startLeft);
      updateLane(drag.id, { width, labelX: clamp(drag.startLabelX + (width - drag.startWidth) / 2, -20, 120) });
    }
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      dragRef.current = null;
      setStatus('Moved');
    }
  }

  function startLabelDrag(event: React.PointerEvent<HTMLSpanElement>, lane: Lane) {
    const bounds = gelMediaRef.current?.getBoundingClientRect();
    if (!bounds) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(lane.id);
    labelDragRef.current = {
      id: lane.id,
      startX: event.clientX,
      startY: event.clientY,
      startLabelX: lane.labelX,
      startLabelY: lane.labelY,
      stageWidth: bounds.width,
      stageHeight: bounds.height,
    };
  }

  function moveLabelDrag(event: React.PointerEvent<HTMLSpanElement>) {
    const drag = labelDragRef.current;
    if (!drag || drag.id !== Number(event.currentTarget.dataset.laneId)) return;
    const deltaX = ((event.clientX - drag.startX) / drag.stageWidth) * 100;
    const deltaY = ((event.clientY - drag.startY) / drag.stageHeight) * 100;
    updateLane(drag.id, {
      labelX: clamp(drag.startLabelX + deltaX, -20, 120),
      labelY: clamp(drag.startLabelY + deltaY, -20, 120),
    });
  }

  function endLabelDrag(event: React.PointerEvent<HTMLSpanElement>) {
    if (!labelDragRef.current) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    labelDragRef.current = null;
    setStatus('Label moved');
  }

  function nudgeLane(event: React.KeyboardEvent<HTMLDivElement>, lane: Lane) {
    const step = event.shiftKey ? 1 : 0.2;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const left = clamp(lane.left + (event.key === 'ArrowRight' ? step : -step), 0, 100 - lane.width);
      updateLane(lane.id, { left, labelX: clamp(lane.labelX + left - lane.left, -20, 120) });
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      deleteLane(lane.id);
    }
  }

  function nudgeLabel(event: React.KeyboardEvent<HTMLSpanElement>, lane: Lane) {
    const step = event.shiftKey ? 1 : 0.2;
    const patch: Partial<Lane> = {};
    if (event.key === 'ArrowLeft') patch.labelX = clamp(lane.labelX - step, -20, 120);
    if (event.key === 'ArrowRight') patch.labelX = clamp(lane.labelX + step, -20, 120);
    if (event.key === 'ArrowUp') patch.labelY = clamp(lane.labelY - step, -20, 120);
    if (event.key === 'ArrowDown') patch.labelY = clamp(lane.labelY + step, -20, 120);
    if (Object.keys(patch).length) {
      event.preventDefault();
      event.stopPropagation();
      updateLane(lane.id, patch);
    }
  }

  function applyStyleToAll() {
    if (!selectedLane) return;
    const { color, labelColor, fontSize, fontFamily, bold, italic, rotation } = selectedLane;
    setLanes((current) => current.map((lane) => ({ ...lane, color, labelColor, fontSize, fontFamily, bold, italic, rotation })));
    setStatus('Style applied');
  }

  function exportFile(format: ExportFormat) {
    const source = imageUrl ? uploadedImageRef.current : demoCanvasRef.current;
    if (!source) return;
    const sourceWidth = imageUrl ? (uploadedImageRef.current?.naturalWidth || imageSize.width) : 1200;
    const sourceHeight = imageUrl ? (uploadedImageRef.current?.naturalHeight || imageSize.height) : 720;
    const scale = sourceWidth / 1200;
    const measuringContext = document.createElement('canvas').getContext('2d');
    let minimumLabelX = 0;
    let maximumLabelX = sourceWidth;
    let minimumLabelY = 0;
    let maximumLabelY = sourceHeight;

    lanes.forEach((lane) => {
      if (!measuringContext) return;
      const fontSize = lane.fontSize * scale;
      const fontFamily = FONT_STACKS[lane.fontFamily] ?? FONT_STACKS.Manrope;
      measuringContext.font = `${lane.italic ? 'italic ' : ''}${lane.bold ? '700 ' : '400 '}${fontSize}px ${fontFamily}`;
      const textWidth = measuringContext.measureText(lane.label || `Lane ${lane.id}`).width + 10 * scale;
      const textHeight = fontSize * 1.25;
      const angle = Math.abs((lane.rotation * Math.PI) / 180);
      const halfWidth = Math.abs(Math.cos(angle)) * textWidth / 2 + Math.abs(Math.sin(angle)) * textHeight / 2;
      const halfHeight = Math.abs(Math.sin(angle)) * textWidth / 2 + Math.abs(Math.cos(angle)) * textHeight / 2;
      const labelX = (lane.labelX / 100) * sourceWidth;
      const labelY = (lane.labelY / 100) * sourceHeight;
      minimumLabelX = Math.min(minimumLabelX, labelX - halfWidth);
      maximumLabelX = Math.max(maximumLabelX, labelX + halfWidth);
      minimumLabelY = Math.min(minimumLabelY, labelY - halfHeight);
      maximumLabelY = Math.max(maximumLabelY, labelY + halfHeight);
    });

    const leftPadding = Math.ceil(Math.max(20 * scale, -minimumLabelX + 12 * scale));
    const rightPadding = Math.ceil(Math.max(20 * scale, maximumLabelX - sourceWidth + 12 * scale));
    const topPadding = Math.ceil(Math.max(28 * scale, -minimumLabelY + 12 * scale));
    const bottomPadding = Math.ceil(Math.max(28 * scale, maximumLabelY - sourceHeight + 12 * scale));
    const outputWidth = Math.ceil(sourceWidth + leftPadding + rightPadding);
    const outputHeight = Math.ceil(sourceHeight + topPadding + bottomPadding);
    const fileBase = (projectName || 'gel').trim().replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'gel';

    const download = (blob: Blob, extension: string) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fileBase}-annotated.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    };

    if (format === 'svg') {
      const imageCanvas = document.createElement('canvas');
      imageCanvas.width = sourceWidth;
      imageCanvas.height = sourceHeight;
      const imageContext = imageCanvas.getContext('2d');
      if (!imageContext || !measuringContext) return;
      imageContext.drawImage(source, 0, 0, sourceWidth, sourceHeight);
      const embeddedImage = imageCanvas.toDataURL('image/png');

      const laneMarkup = lanes.map((lane) => {
        const x = leftPadding + (lane.left / 100) * sourceWidth;
        const width = (lane.width / 100) * sourceWidth;
        const y = topPadding + sourceHeight * 0.04;
        const height = sourceHeight * 0.92;
        const fontSize = lane.fontSize * scale;
        const fontFamily = FONT_STACKS[lane.fontFamily] ?? FONT_STACKS.Manrope;
        const text = lane.label || `Lane ${lane.id}`;
        measuringContext.font = `${lane.italic ? 'italic ' : ''}${lane.bold ? '700 ' : '400 '}${fontSize}px ${fontFamily}`;
        const textWidth = measuringContext.measureText(text).width;
        const padding = 5 * scale;
        const labelX = leftPadding + (lane.labelX / 100) * sourceWidth;
        const labelY = topPadding + (lane.labelY / 100) * sourceHeight;
        return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${escapeXml(lane.color)}" fill-opacity=".035" stroke="${escapeXml(lane.color)}" stroke-width="${Math.max(2, 2 * scale)}"/><g transform="translate(${labelX} ${labelY}) rotate(${lane.rotation})"><rect x="${-textWidth / 2 - padding}" y="${-fontSize * 0.65}" width="${textWidth + padding * 2}" height="${fontSize * 1.25}" fill="#fff" fill-opacity=".92"/><text x="0" y="0" dominant-baseline="middle" text-anchor="middle" fill="${escapeXml(lane.labelColor)}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="${lane.bold ? 700 : 400}" font-style="${lane.italic ? 'italic' : 'normal'}">${escapeXml(text)}</text></g>`;
      }).join('');

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${outputWidth}" height="${outputHeight}" viewBox="0 0 ${outputWidth} ${outputHeight}"><rect width="100%" height="100%" fill="#fff"/><image href="${embeddedImage}" x="${leftPadding}" y="${topPadding}" width="${sourceWidth}" height="${sourceHeight}" preserveAspectRatio="none"/>${laneMarkup}</svg>`;
      download(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), 'svg');
      setStatus('SVG exported');
      return;
    }

    const output = document.createElement('canvas');
    output.width = outputWidth;
    output.height = outputHeight;
    const context = output.getContext('2d');
    if (!context) return;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, output.width, output.height);
    context.drawImage(source, leftPadding, topPadding, sourceWidth, sourceHeight);

    lanes.forEach((lane) => {
      const x = leftPadding + (lane.left / 100) * sourceWidth;
      const width = (lane.width / 100) * sourceWidth;
      const y = topPadding + sourceHeight * 0.04;
      const height = sourceHeight * 0.92;
      context.fillStyle = alpha(lane.color, 0.035);
      context.fillRect(x, y, width, height);
      context.strokeStyle = lane.color;
      context.lineWidth = Math.max(2, 2 * scale);
      context.strokeRect(x, y, width, height);

      const fontSize = lane.fontSize * scale;
      context.font = `${lane.italic ? 'italic ' : ''}${lane.bold ? '700 ' : '400 '}${fontSize}px ${lane.fontFamily}`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = lane.labelColor;
      context.save();
      context.translate(leftPadding + (lane.labelX / 100) * sourceWidth, topPadding + (lane.labelY / 100) * sourceHeight);
      context.rotate((lane.rotation * Math.PI) / 180);
      const metrics = context.measureText(lane.label || `Lane ${lane.id}`);
      const padding = 5 * scale;
      context.fillStyle = 'rgba(255,255,255,.9)';
      context.fillRect(-metrics.width / 2 - padding, -fontSize * 0.65, metrics.width + padding * 2, fontSize * 1.25);
      context.fillStyle = lane.labelColor;
      context.fillText(lane.label || `Lane ${lane.id}`, 0, 0);
      context.restore();
    });

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const extension = format === 'jpeg' ? 'jpg' : 'png';
    output.toBlob((blob) => {
      if (!blob) return;
      download(blob, extension);
      setStatus(`${format.toUpperCase()} exported`);
    }, mimeType, format === 'jpeg' ? 0.94 : undefined);
  }

  const mediaAspect = `${imageSize.width} / ${imageSize.height}`;

  return (
    <main className="app-shell min-h-screen bg-background text-foreground">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <p className="brand-name"><span>Lane</span><span>Studio</span></p>
        </div>

        <div className="toolbar" aria-label="Canvas controls">
          <label className="upload-button">
            <Upload className="size-4" />
            <span>Upload</span>
            <input className="sr-only" type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files?.[0])} />
          </label>
          <Button variant="outline" className="toolbar-button" onClick={addLane}><Plus /> Add</Button>
          <Button variant="outline" className="toolbar-button optional-control" onClick={distributeLanes} disabled={lanes.length < 2}><AlignHorizontalDistributeCenter /> Distribute</Button>
          <div className="export-controls">
            <NativeSelect aria-label="Export format" size="sm" value={exportFormat} onChange={(event) => setExportFormat(event.target.value as ExportFormat)}>
              <NativeSelectOption value="png">PNG</NativeSelectOption>
              <NativeSelectOption value="jpeg">JPEG</NativeSelectOption>
              <NativeSelectOption value="svg">SVG</NativeSelectOption>
            </NativeSelect>
            <Button className="toolbar-button export-button" onClick={() => exportFile(exportFormat)}><Download /> Export</Button>
          </div>
        </div>
      </header>

      <section className="workspace-grid">
        <aside className="lane-panel">
          <div className="project-block">
            <p className="panel-kicker">Current image</p>
            <div className="project-name-row">
              <h1 title={projectName}>{projectName}</h1>
              <span className="lane-count">{lanes.length}</span>
            </div>
          </div>

          <div className="grid-builder">
            <label htmlFor="lane-count">Lane grid</label>
            <div>
              <Input id="lane-count" type="number" min={1} max={30} value={laneCount} onChange={(event) => setLaneCount(clamp(Number(event.target.value), 1, 30))} />
              <Button onClick={() => createLaneGrid()}>Set</Button>
            </div>
          </div>

          <div className="panel-action-row">
            <Button variant="outline" size="sm" onClick={distributeLanes} disabled={lanes.length < 2}><AlignHorizontalDistributeCenter /> Space</Button>
            <Button variant="outline" size="sm" onClick={equalizeWidths} disabled={!lanes.length}><Equal /> Same width</Button>
          </div>

          <div className="lane-list-heading"><span>Lanes</span><span>{lanes.length}</span></div>
          <div className="lane-list" role="listbox" aria-label="Lanes">
            {lanes.map((lane, index) => (
              <button
                key={lane.id}
                type="button"
                role="option"
                aria-selected={selectedId === lane.id}
                className={`lane-row ${selectedId === lane.id ? 'is-active' : ''}`}
                onClick={() => setSelectedId(lane.id)}
              >
                <GripVertical className="grip-icon" aria-hidden="true" />
                <span className="lane-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="lane-color-dot" style={{ background: lane.color }} />
                <span className="lane-row-label">{lane.label || `Lane ${index + 1}`}</span>
              </button>
            ))}
            {!lanes.length && <div className="empty-lanes"><ImagePlus /><p>No lanes</p><Button size="sm" onClick={addLane}>Add</Button></div>}
          </div>

          <Button variant="ghost" className="reset-button" onClick={resetDemo}><RotateCcw /> Reset</Button>
        </aside>

        <section className="canvas-panel" aria-label="Gel annotation canvas">
          <div className="canvas-meta">
            <div><span className="status-dot" /><span>{status}</span></div>
            <span className="pixel-badge">{imageSize.width} × {imageSize.height} px</span>
          </div>
          <div className="gel-stage">
            <div ref={gelMediaRef} className="gel-media" style={{ aspectRatio: mediaAspect }}>
              {imageUrl ? (
                <img
                  ref={uploadedImageRef}
                  src={imageUrl}
                  alt="Uploaded gel or blot"
                  draggable={false}
                  onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
                />
              ) : (
                <canvas ref={demoCanvasRef} aria-label="Synthetic example gel" />
              )}

              {lanes.map((lane, index) => (
                <div
                  key={lane.id}
                  data-lane-id={lane.id}
                  className={`lane-overlay ${selectedId === lane.id ? 'is-selected' : ''}`}
                  style={{ left: `${lane.left}%`, width: `${lane.width}%`, borderColor: lane.color, background: alpha(lane.color, 0.035) }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${lane.label || `Lane ${index + 1}`}. Drag to move; use arrow keys to nudge.`}
                  onPointerDown={(event) => startDrag(event, lane)}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onKeyDown={(event) => nudgeLane(event, lane)}
                  onFocus={() => setSelectedId(lane.id)}
                >
                  <span className="resize-handle left" data-mode="resize-left" aria-hidden="true" />
                  <span className="resize-handle right" data-mode="resize-right" aria-hidden="true" />
                </div>
              ))}

              {lanes.map((lane, index) => (
                <span
                  key={`label-${lane.id}`}
                  data-lane-id={lane.id}
                  className={`lane-label ${selectedId === lane.id ? 'is-selected' : ''}`}
                  style={{
                    left: `${lane.labelX}%`,
                    top: `${lane.labelY}%`,
                    color: lane.labelColor,
                    fontFamily: FONT_STACKS[lane.fontFamily] ?? FONT_STACKS.Manrope,
                    fontSize: `${lane.fontSize}px`,
                    fontWeight: lane.bold ? 700 : 400,
                    fontStyle: lane.italic ? 'italic' : 'normal',
                    transform: `translate(-50%, -50%) rotate(${lane.rotation}deg)`,
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${lane.label || `Lane ${index + 1}`} label. Drag to reposition.`}
                  onPointerDown={(event) => startLabelDrag(event, lane)}
                  onPointerMove={moveLabelDrag}
                  onPointerUp={endLabelDrag}
                  onPointerCancel={endLabelDrag}
                  onKeyDown={(event) => nudgeLabel(event, lane)}
                  onFocus={() => setSelectedId(lane.id)}
                >
                  {lane.label || `Lane ${index + 1}`}
                </span>
              ))}
            </div>
          </div>
          <div className="canvas-help"><span>Lane: drag</span><span>Label: drag</span><span>Handles: resize</span></div>
        </section>

        <aside className="inspector-panel">
          <div className="inspector-heading"><SlidersHorizontal /><div><p className="panel-kicker">Lane</p><h2>{selectedLane?.label || 'None'}</h2></div></div>

          {selectedLane ? (
            <div className="inspector-fields">
              <div className="field-group">
                <label htmlFor="lane-label">Label</label>
                <Input id="lane-label" value={selectedLane.label} placeholder="Enter a label" onChange={(event) => updateLane(selectedLane.id, { label: event.target.value })} />
              </div>

              <div className="field-group">
                <label htmlFor="label-preset">Preset</label>
                <NativeSelect id="label-preset" className="w-full" value="" onChange={(event) => event.target.value && updateLane(selectedLane.id, { label: event.target.value })}>
                  <NativeSelectOption value="">Select…</NativeSelectOption>
                  <NativeSelectOption value="Marker">Marker</NativeSelectOption>
                  <NativeSelectOption value="Control">Control</NativeSelectOption>
                  <NativeSelectOption value="Blank">Blank</NativeSelectOption>
                  <NativeSelectOption value="Sample">Sample</NativeSelectOption>
                  <NativeSelectOption value="Treatment">Treatment</NativeSelectOption>
                </NativeSelect>
              </div>

              <div className="field-group">
                <label htmlFor="font-family">Typeface</label>
                <NativeSelect id="font-family" className="w-full" value={selectedLane.fontFamily} onChange={(event) => updateLane(selectedLane.id, { fontFamily: event.target.value })}>
                  {Object.keys(FONT_STACKS).map((font) => <NativeSelectOption key={font} value={font}>{font}</NativeSelectOption>)}
                </NativeSelect>
              </div>

              <div className="field-group">
                <div className="field-label-row"><label htmlFor="font-size">Text size</label><output>{selectedLane.fontSize} px</output></div>
                <Slider id="font-size" min={10} max={44} step={1} value={[selectedLane.fontSize]} onValueChange={(value) => updateLane(selectedLane.id, { fontSize: Array.isArray(value) ? Number(value[0]) : Number(value) })} />
              </div>

              <div className="format-row">
                <div className="field-group grow">
                  <label>Style</label>
                  <div className="toggle-pair">
                    <Toggle variant="outline" pressed={selectedLane.bold} onPressedChange={(pressed) => updateLane(selectedLane.id, { bold: pressed })} aria-label="Bold"><Bold /></Toggle>
                    <Toggle variant="outline" pressed={selectedLane.italic} onPressedChange={(pressed) => updateLane(selectedLane.id, { italic: pressed })} aria-label="Italic"><Italic /></Toggle>
                  </div>
                </div>
                <div className="field-group color-field">
                  <label htmlFor="label-color">Text color</label>
                  <label className="color-control" title={selectedLane.labelColor}>
                    <input id="label-color" type="color" value={selectedLane.labelColor} onChange={(event) => updateLane(selectedLane.id, { labelColor: event.target.value })} />
                    <span>{selectedLane.labelColor.toUpperCase()}</span>
                  </label>
                </div>
              </div>

              <div className="two-columns">
                <div className="field-group">
                  <label htmlFor="rotation">Angle</label>
                  <NativeSelect id="rotation" className="w-full" value={String(selectedLane.rotation)} onChange={(event) => updateLane(selectedLane.id, { rotation: Number(event.target.value) })}>
                    <NativeSelectOption value="0">0°</NativeSelectOption>
                    <NativeSelectOption value="-30">−30°</NativeSelectOption>
                    <NativeSelectOption value="-45">−45°</NativeSelectOption>
                    <NativeSelectOption value="-60">−60°</NativeSelectOption>
                    <NativeSelectOption value="-90">−90°</NativeSelectOption>
                  </NativeSelect>
                </div>
                <div className="field-group">
                  <label htmlFor="label-position">Position</label>
                  <NativeSelect id="label-position" className="w-full" value={selectedLane.labelPosition} onChange={(event) => {
                    const labelPosition = event.target.value as LabelPosition;
                    updateLane(selectedLane.id, { labelPosition, labelY: LABEL_Y[labelPosition] });
                  }}>
                    <NativeSelectOption value="top">Above</NativeSelectOption>
                    <NativeSelectOption value="inside">Inside</NativeSelectOption>
                    <NativeSelectOption value="bottom">Below</NativeSelectOption>
                  </NativeSelect>
                </div>
              </div>

              <div className="coordinate-block">
                <div className="field-label-row"><label>Label coordinates</label><output>X / Y %</output></div>
                <div className="coordinate-grid">
                  <Input aria-label="Label horizontal position" type="number" min={-20} max={120} step={0.1} value={Number(selectedLane.labelX.toFixed(1))} onChange={(event) => updateLane(selectedLane.id, { labelX: clamp(Number(event.target.value), -20, 120) })} />
                  <Input aria-label="Label vertical position" type="number" min={-20} max={120} step={0.1} value={Number(selectedLane.labelY.toFixed(1))} onChange={(event) => updateLane(selectedLane.id, { labelY: clamp(Number(event.target.value), -20, 120) })} />
                  <Button variant="outline" size="sm" onClick={() => updateLane(selectedLane.id, { labelX: selectedLane.left + selectedLane.width / 2, labelY: LABEL_Y[selectedLane.labelPosition] })}>Reset</Button>
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="line-color">Lane outline</label>
                <label className="color-control wide" title={selectedLane.color}>
                  <input id="line-color" type="color" value={selectedLane.color} onChange={(event) => updateLane(selectedLane.id, { color: event.target.value })} />
                  <span>{selectedLane.color.toUpperCase()}</span>
                </label>
              </div>

              <Button variant="secondary" className="w-full" onClick={applyStyleToAll}>Apply to all</Button>
              <Button variant="destructive" className="w-full" onClick={() => deleteLane()}><Trash2 /> Delete lane</Button>
            </div>
          ) : (
            <div className="empty-inspector"><Plus /><p>Select a lane.</p><Button onClick={addLane}>Add</Button></div>
          )}
        </aside>
      </section>
      <span className="sr-only" role="status" aria-live="polite">{status}</span>
    </main>
  );
}
