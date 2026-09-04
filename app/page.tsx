'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignHorizontalDistributeCenter,
  AlignVerticalJustifyCenter,
  Bold,
  Copy,
  Crop,
  Download,
  Equal,
  GripVertical,
  ImagePlus,
  Italic,
  Maximize2,
  Plus,
  RotateCcw,
  RotateCw,
  ScanLine,
  SlidersHorizontal,
  Trash2,
  Underline,
  Upload,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';

type LabelPosition = 'top' | 'inside' | 'bottom';
type ExportFormat = 'png' | 'jpeg' | 'svg';

type CropState = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type Lane = {
  id: number;
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
  boxRotation: number;
  color: string;
  labelColor: string;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  rotation: number;
  labelPosition: LabelPosition;
  labelX: number;
  labelY: number;
};

type DragState = {
  id: number;
  mode: 'move' | 'resize-left' | 'resize-right' | 'resize-top' | 'resize-bottom' | 'resize-top-left' | 'resize-top-right' | 'resize-bottom-left' | 'resize-bottom-right' | 'rotate';
  startX: number;
  startY: number;
  startLeft: number;
  startTop: number;
  startWidth: number;
  startHeight: number;
  startLabelX: number;
  startLabelY: number;
  startRotation: number;
  centerX: number;
  centerY: number;
  startPointerAngle: number;
  stageWidth: number;
  stageHeight: number;
};

type LabelTransformState = {
  id: number;
  mode: 'move' | 'resize' | 'rotate';
  startX: number;
  startY: number;
  startLabelX: number;
  startLabelY: number;
  startFontSize: number;
  startRotation: number;
  centerX: number;
  centerY: number;
  startPointerDistance: number;
  startPointerAngle: number;
  stageWidth: number;
  stageHeight: number;
};

type CropDragState = {
  side: keyof CropState;
  startX: number;
  startY: number;
  startValue: number;
  stageWidth: number;
  stageHeight: number;
};

const LABEL_Y: Record<LabelPosition, number> = {
  top: -7,
  inside: 6,
  bottom: 107,
};

const DEFAULT_CROP: CropState = { top: 0, right: 0, bottom: 0, left: 0 };

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
].map((lane): Lane => ({ ...lane, top: 4, height: 92, boxRotation: 0, underline: false, labelPosition: lane.labelPosition as LabelPosition }));

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

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
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
  const labelDragRef = useRef<LabelTransformState | null>(null);
  const cropDragRef = useRef<CropDragState | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const nextIdRef = useRef(10);
  const undoStackRef = useRef<Lane[][]>([]);
  const redoStackRef = useRef<Lane[][]>([]);
  const copiedLaneRef = useRef<Lane | null>(null);

  const [lanes, setLanesState] = useState<Lane[]>(INITIAL_LANES);
  const [selectedId, setSelectedId] = useState(7);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 1200, height: 720 });
  const [projectName, setProjectName] = useState('Demo gel');
  const [laneCount, setLaneCount] = useState(9);
  const [status, setStatus] = useState('Demo');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [crop, setCrop] = useState<CropState>(DEFAULT_CROP);

  const selectedLane = useMemo(() => lanes.find((lane) => lane.id === selectedId) ?? null, [lanes, selectedId]);

  function setLanes(action: Lane[] | ((current: Lane[]) => Lane[])) {
    setLanesState((current) => {
      const next = typeof action === 'function' ? action(current) : action;
      if (next === current) return current;
      undoStackRef.current = [...undoStackRef.current.slice(-79), current];
      redoStackRef.current = [];
      return next;
    });
  }

  useEffect(() => {
    if (!imageUrl && demoCanvasRef.current) drawDemoGel(demoCanvasRef.current);
  }, [imageUrl]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      const primaryKey = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      const editable = isEditableTarget(event.target);

      if (!primaryKey) {
        if (!editable && selectedLane && (event.key === 'Delete' || event.key === 'Backspace')) {
          event.preventDefault();
          deleteLane(selectedLane.id);
        }
        return;
      }

      if (editable && !['b', 'i', 'u', 's'].includes(key)) return;

      if (key === 'b' && selectedLane) {
        event.preventDefault();
        updateLane(selectedLane.id, { bold: !selectedLane.bold });
        setStatus(selectedLane.bold ? 'Bold off' : 'Bold on');
        return;
      }
      if (key === 'i' && selectedLane) {
        event.preventDefault();
        updateLane(selectedLane.id, { italic: !selectedLane.italic });
        setStatus(selectedLane.italic ? 'Italic off' : 'Italic on');
        return;
      }
      if (key === 'u' && selectedLane) {
        event.preventDefault();
        updateLane(selectedLane.id, { underline: !selectedLane.underline });
        setStatus(selectedLane.underline ? 'Underline off' : 'Underline on');
        return;
      }
      if (key === 's') {
        event.preventDefault();
        exportFile(exportFormat);
        return;
      }
      if ((key === ']' || key === '>') && selectedLane) {
        event.preventDefault();
        updateLane(selectedLane.id, { fontSize: clamp(selectedLane.fontSize + 1, 8, 72) });
        setStatus('Text enlarged');
        return;
      }
      if ((key === '[' || key === '<') && selectedLane) {
        event.preventDefault();
        updateLane(selectedLane.id, { fontSize: clamp(selectedLane.fontSize - 1, 8, 72) });
        setStatus('Text reduced');
        return;
      }
      if (!editable && key === 'c') {
        event.preventDefault();
        copySelectedLane();
        return;
      }
      if (!editable && key === 'v') {
        event.preventDefault();
        pasteCopiedLane();
        return;
      }
      if (!editable && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
        return;
      }
      if (!editable && key === 'y') {
        event.preventDefault();
        redo();
      }
    }

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [selectedLane, lanes]);

  function updateLane(id: number, patch: Partial<Lane>) {
    setLanes((current) => current.map((lane) => lane.id === id ? { ...lane, ...patch } : lane));
  }

  function updateLaneBox(id: number, patch: Partial<Pick<Lane, 'left' | 'top' | 'width' | 'height' | 'boxRotation'>>) {
    setLanes((current) => current.map((lane) => {
      if (lane.id !== id) return lane;
      const next = { ...lane, ...patch };
      const centerShiftX = next.left + next.width / 2 - (lane.left + lane.width / 2);
      const centerShiftY = next.top + next.height / 2 - (lane.top + lane.height / 2);
      return {
        ...next,
        labelX: clamp(lane.labelX + centerShiftX, -20, 120),
        labelY: clamp(lane.labelY + centerShiftY, -20, 120),
      };
    }));
  }

  function getGridLayout(count: number) {
    const availableWidth = 100 - crop.left - crop.right;
    const availableHeight = 100 - crop.top - crop.bottom;
    const horizontalInset = Math.min(4, availableWidth * 0.04);
    const verticalInset = Math.min(4, availableHeight * 0.04);
    const usableWidth = Math.max(1, availableWidth - horizontalInset * 2);
    const gap = count > 1 ? Math.min(1.3, Math.max(0.15, usableWidth / (count * 10))) : 0;
    const width = Math.max(0.5, (usableWidth - gap * (count - 1)) / count);
    return {
      start: crop.left + horizontalInset,
      top: crop.top + verticalInset,
      width,
      height: Math.max(2, availableHeight - verticalInset * 2),
      gap,
    };
  }

  function createLaneGrid(count = laneCount) {
    const safeCount = clamp(Math.round(count), 1, 30);
    const layout = getGridLayout(safeCount);
    const freshLanes = Array.from({ length: safeCount }, (_, index): Lane => {
      const left = clamp(layout.start + index * (layout.width + layout.gap), crop.left, 100 - crop.right - layout.width);
      return {
        id: nextIdRef.current++,
        label: index === 0 ? 'Marker' : `Lane ${index + 1}`,
        left,
        top: layout.top,
        width: layout.width,
        height: layout.height,
        boxRotation: 0,
        color: '#0b5fa5',
        labelColor: '#063f73',
        fontSize: 17,
        fontFamily: 'Manrope',
        bold: true,
        italic: false,
        underline: false,
        rotation: safeCount > 7 ? -45 : 0,
        labelPosition: 'top',
        labelX: left + layout.width / 2,
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
      top: selectedLane?.top ?? 4,
      width,
      height: selectedLane?.height ?? 92,
      boxRotation: selectedLane?.boxRotation ?? 0,
      color: selectedLane?.color ?? '#0b5fa5',
      labelColor: selectedLane?.labelColor ?? '#063f73',
      fontSize: selectedLane?.fontSize ?? 17,
      fontFamily: selectedLane?.fontFamily ?? 'Manrope',
      bold: selectedLane?.bold ?? true,
      italic: selectedLane?.italic ?? false,
      underline: selectedLane?.underline ?? false,
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

  function undo() {
    const previous = undoStackRef.current.pop();
    if (!previous) {
      setStatus('Nothing to undo');
      return;
    }
    redoStackRef.current = [...redoStackRef.current.slice(-79), lanes];
    setLanesState(previous);
    setLaneCount(previous.length || 1);
    if (!previous.some((lane) => lane.id === selectedId)) setSelectedId(previous[0]?.id ?? -1);
    setStatus('Undo');
  }

  function redo() {
    const next = redoStackRef.current.pop();
    if (!next) {
      setStatus('Nothing to redo');
      return;
    }
    undoStackRef.current = [...undoStackRef.current.slice(-79), lanes];
    setLanesState(next);
    setLaneCount(next.length || 1);
    if (!next.some((lane) => lane.id === selectedId)) setSelectedId(next[0]?.id ?? -1);
    setStatus('Redo');
  }

  function copySelectedLane() {
    if (!selectedLane) return;
    copiedLaneRef.current = { ...selectedLane };
    setStatus('Lane copied');
  }

  function pasteCopiedLane() {
    const copied = copiedLaneRef.current;
    if (!copied) {
      setStatus('Nothing to paste');
      return;
    }
    const id = nextIdRef.current++;
    const left = clamp(copied.left + 2, 0, 100 - copied.width);
    const top = clamp(copied.top + 2, 0, 100 - copied.height);
    const lane: Lane = {
      ...copied,
      id,
      left,
      top,
      labelX: clamp(copied.labelX + left - copied.left, -20, 120),
      labelY: clamp(copied.labelY + top - copied.top, -20, 120),
    };
    setLanes((current) => [...current, lane]);
    setSelectedId(id);
    setLaneCount(lanes.length + 1);
    setStatus('Lane pasted');
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

  function alignLabels() {
    if (!lanes.length) return;
    const reference = selectedLane ?? lanes[0];
    setLanes((current) => current.map((lane) => ({
      ...lane,
      labelPosition: reference.labelPosition,
      labelX: clamp(lane.left + lane.width / 2, -20, 120),
      labelY: reference.labelY,
      rotation: reference.rotation,
    })));
    setStatus('All labels aligned');
  }

  function tidyForExport() {
    if (lanes.length < 2) return;
    const reference = selectedLane ?? lanes[0];
    const sorted = [...lanes].sort((a, b) => a.left - b.left);
    const start = sorted[0].left + sorted[0].width / 2;
    const end = sorted.at(-1)!.left + sorted.at(-1)!.width / 2;
    const spacing = (end - start) / (sorted.length - 1);
    const positions = new Map(sorted.map((lane, index) => [lane.id, clamp(start + index * spacing - lane.width / 2, 0, 100 - lane.width)]));

    setLanes((current) => current.map((lane) => {
      const left = positions.get(lane.id) ?? lane.left;
      return {
        ...lane,
        left,
        labelPosition: reference.labelPosition,
        labelX: clamp(left + lane.width / 2, -20, 120),
        labelY: reference.labelY,
        rotation: reference.rotation,
      };
    }));
    setStatus('Aligned · even spacing');
  }

  function fitLaneGrid() {
    if (!lanes.length) return;
    const sorted = [...lanes].sort((a, b) => a.left - b.left);
    const layout = getGridLayout(sorted.length);
    const positions = new Map(sorted.map((lane, index) => [lane.id, clamp(layout.start + index * (layout.width + layout.gap), crop.left, 100 - crop.right - layout.width)]));

    setLanes((current) => current.map((lane) => {
      const left = positions.get(lane.id) ?? lane.left;
      const labelOffset = lane.labelX - (lane.left + lane.width / 2);
      return {
        ...lane,
        left,
        top: layout.top,
        width: layout.width,
        height: layout.height,
        boxRotation: 0,
        labelX: clamp(left + layout.width / 2 + labelOffset, -20, 120),
      };
    }));
    setStatus('Lanes fitted');
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
    setCrop(DEFAULT_CROP);
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
    setCrop(DEFAULT_CROP);
    setProjectName(file.name.replace(/\.[^.]+$/, ''));
    setStatus('Image loaded');
  }

  function updateCrop(side: keyof CropState, value: number) {
    setCrop((current) => {
      const opposite: Record<keyof CropState, keyof CropState> = {
        top: 'bottom',
        right: 'left',
        bottom: 'top',
        left: 'right',
      };
      const maximum = 95 - current[opposite[side]];
      return { ...current, [side]: clamp(Number.isFinite(value) ? value : 0, 0, maximum) };
    });
    setStatus('Crop adjusted');
  }

  function startCropDrag(event: React.PointerEvent<HTMLSpanElement>, side: keyof CropState) {
    const bounds = gelMediaRef.current?.getBoundingClientRect();
    if (!bounds) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    cropDragRef.current = {
      side,
      startX: event.clientX,
      startY: event.clientY,
      startValue: crop[side],
      stageWidth: bounds.width,
      stageHeight: bounds.height,
    };
  }

  function moveCropDrag(event: React.PointerEvent<HTMLSpanElement>) {
    const drag = cropDragRef.current;
    if (!drag) return;
    const deltaX = ((event.clientX - drag.startX) / drag.stageWidth) * 100;
    const deltaY = ((event.clientY - drag.startY) / drag.stageHeight) * 100;
    const delta = drag.side === 'left' ? deltaX
      : drag.side === 'right' ? -deltaX
        : drag.side === 'top' ? deltaY
          : -deltaY;
    updateCrop(drag.side, drag.startValue + delta);
  }

  function endCropDrag(event: React.PointerEvent<HTMLSpanElement>) {
    if (!cropDragRef.current) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    cropDragRef.current = null;
    setStatus('Crop set');
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>, lane: Lane) {
    const target = event.target as HTMLElement;
    const mode = (target.dataset.mode as DragState['mode'] | undefined) ?? 'move';
    const bounds = gelMediaRef.current?.getBoundingClientRect();
    if (!bounds) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(lane.id);
    const centerX = bounds.left + ((lane.left + lane.width / 2) / 100) * bounds.width;
    const centerY = bounds.top + ((lane.top + lane.height / 2) / 100) * bounds.height;
    dragRef.current = {
      id: lane.id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: lane.left,
      startTop: lane.top,
      startWidth: lane.width,
      startHeight: lane.height,
      startLabelX: lane.labelX,
      startLabelY: lane.labelY,
      startRotation: lane.boxRotation,
      centerX,
      centerY,
      startPointerAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI,
      stageWidth: bounds.width,
      stageHeight: bounds.height,
    };
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id !== Number(event.currentTarget.dataset.laneId)) return;
    const deltaX = ((event.clientX - drag.startX) / drag.stageWidth) * 100;
    const deltaY = ((event.clientY - drag.startY) / drag.stageHeight) * 100;

    if (drag.mode === 'rotate') {
      const pointerAngle = Math.atan2(event.clientY - drag.centerY, event.clientX - drag.centerX) * 180 / Math.PI;
      const angleDelta = ((pointerAngle - drag.startPointerAngle + 540) % 360) - 180;
      const rawRotation = clamp(drag.startRotation + angleDelta, -60, 60);
      updateLane(drag.id, { boxRotation: event.shiftKey ? Math.round(rawRotation / 5) * 5 : Math.round(rawRotation * 10) / 10 });
      return;
    }

    if (drag.mode === 'move') {
      const left = clamp(drag.startLeft + deltaX, 0, 100 - drag.startWidth);
      const top = clamp(drag.startTop + deltaY, 0, 100 - drag.startHeight);
      updateLane(drag.id, {
        left,
        top,
        labelX: clamp(drag.startLabelX + left - drag.startLeft, -20, 120),
        labelY: clamp(drag.startLabelY + top - drag.startTop, -20, 120),
      });
      return;
    }

    const radians = drag.startRotation * Math.PI / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    const deltaXInPixels = event.clientX - drag.startX;
    const deltaYInPixels = event.clientY - drag.startY;
    const localDeltaX = deltaXInPixels * cosine + deltaYInPixels * sine;
    const localDeltaY = -deltaXInPixels * sine + deltaYInPixels * cosine;
    let width = drag.startWidth;
    let height = drag.startHeight;
    let localCenterShiftX = 0;
    let localCenterShiftY = 0;

    if (drag.mode === 'resize-left' || drag.mode === 'resize-top-left' || drag.mode === 'resize-bottom-left') {
      width = clamp(drag.startWidth - (localDeltaX / drag.stageWidth) * 100, 1.5, 100);
      localCenterShiftX = ((drag.startWidth - width) / 200) * drag.stageWidth;
    } else if (drag.mode === 'resize-right' || drag.mode === 'resize-top-right' || drag.mode === 'resize-bottom-right') {
      width = clamp(drag.startWidth + (localDeltaX / drag.stageWidth) * 100, 1.5, 100);
      localCenterShiftX = ((width - drag.startWidth) / 200) * drag.stageWidth;
    }

    if (drag.mode === 'resize-top' || drag.mode === 'resize-top-left' || drag.mode === 'resize-top-right') {
      height = clamp(drag.startHeight - (localDeltaY / drag.stageHeight) * 100, 2, 100);
      localCenterShiftY = ((drag.startHeight - height) / 200) * drag.stageHeight;
    } else if (drag.mode === 'resize-bottom' || drag.mode === 'resize-bottom-left' || drag.mode === 'resize-bottom-right') {
      height = clamp(drag.startHeight + (localDeltaY / drag.stageHeight) * 100, 2, 100);
      localCenterShiftY = ((height - drag.startHeight) / 200) * drag.stageHeight;
    }

    const screenShiftX = localCenterShiftX * cosine - localCenterShiftY * sine;
    const screenShiftY = localCenterShiftX * sine + localCenterShiftY * cosine;
    const startCenterX = drag.startLeft + drag.startWidth / 2;
    const startCenterY = drag.startTop + drag.startHeight / 2;
    const proposedCenterX = startCenterX + (screenShiftX / drag.stageWidth) * 100;
    const proposedCenterY = startCenterY + (screenShiftY / drag.stageHeight) * 100;
    const left = clamp(proposedCenterX - width / 2, 0, 100 - width);
    const top = clamp(proposedCenterY - height / 2, 0, 100 - height);
    const centerShiftX = left + width / 2 - startCenterX;
    const centerShiftY = top + height / 2 - startCenterY;
    updateLane(drag.id, {
      left,
      top,
      width,
      height,
      labelX: clamp(drag.startLabelX + centerShiftX, -20, 120),
      labelY: clamp(drag.startLabelY + centerShiftY, -20, 120),
    });
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      dragRef.current = null;
      setStatus('Box adjusted');
    }
  }

  function startLabelDrag(event: React.PointerEvent<HTMLSpanElement>, lane: Lane) {
    const bounds = gelMediaRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const target = event.target as HTMLElement;
    const handle = target.closest('[data-label-mode]') as HTMLElement | null;
    const mode = (handle?.dataset.labelMode as LabelTransformState['mode'] | undefined) ?? 'move';
    const centerX = bounds.left + (lane.labelX / 100) * bounds.width;
    const centerY = bounds.top + (lane.labelY / 100) * bounds.height;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(lane.id);
    labelDragRef.current = {
      id: lane.id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startLabelX: lane.labelX,
      startLabelY: lane.labelY,
      startFontSize: lane.fontSize,
      startRotation: lane.rotation,
      centerX,
      centerY,
      startPointerDistance: Math.max(1, Math.hypot(event.clientX - centerX, event.clientY - centerY)),
      startPointerAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI,
      stageWidth: bounds.width,
      stageHeight: bounds.height,
    };
  }

  function moveLabelDrag(event: React.PointerEvent<HTMLSpanElement>) {
    const drag = labelDragRef.current;
    if (!drag || drag.id !== Number(event.currentTarget.dataset.laneId)) return;

    if (drag.mode === 'resize') {
      const pointerDistance = Math.max(1, Math.hypot(event.clientX - drag.centerX, event.clientY - drag.centerY));
      const fontSize = clamp(drag.startFontSize * pointerDistance / drag.startPointerDistance, 8, 72);
      updateLane(drag.id, { fontSize: Math.round(fontSize) });
      return;
    }

    if (drag.mode === 'rotate') {
      const pointerAngle = Math.atan2(event.clientY - drag.centerY, event.clientX - drag.centerX) * 180 / Math.PI;
      const angleDelta = ((pointerAngle - drag.startPointerAngle + 540) % 360) - 180;
      const rawRotation = ((drag.startRotation + angleDelta + 540) % 360) - 180;
      updateLane(drag.id, { rotation: event.shiftKey ? Math.round(rawRotation / 5) * 5 : Math.round(rawRotation) });
      return;
    }

    const deltaX = ((event.clientX - drag.startX) / drag.stageWidth) * 100;
    const deltaY = ((event.clientY - drag.startY) / drag.stageHeight) * 100;
    updateLane(drag.id, {
      labelX: clamp(drag.startLabelX + deltaX, -20, 120),
      labelY: clamp(drag.startLabelY + deltaY, -20, 120),
    });
  }

  function endLabelDrag(event: React.PointerEvent<HTMLSpanElement>) {
    if (!labelDragRef.current) return;
    const mode = labelDragRef.current.mode;
    event.currentTarget.releasePointerCapture(event.pointerId);
    labelDragRef.current = null;
    setStatus(mode === 'resize' ? 'Text resized' : mode === 'rotate' ? 'Text rotated' : 'Label moved');
  }

  function nudgeLane(event: React.KeyboardEvent<HTMLDivElement>, lane: Lane) {
    const step = event.shiftKey ? 1 : 0.2;
    if (event.key.startsWith('Arrow')) {
      event.preventDefault();
      const left = clamp(lane.left + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0), 0, 100 - lane.width);
      const top = clamp(lane.top + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0), 0, 100 - lane.height);
      updateLane(lane.id, {
        left,
        top,
        labelX: clamp(lane.labelX + left - lane.left, -20, 120),
        labelY: clamp(lane.labelY + top - lane.top, -20, 120),
      });
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
    const { color, labelColor, fontSize, fontFamily, bold, italic, underline, rotation } = selectedLane;
    setLanes((current) => current.map((lane) => ({ ...lane, color, labelColor, fontSize, fontFamily, bold, italic, underline, rotation })));
    setStatus('Style applied');
  }

  function applyBoxToAll() {
    if (!selectedLane) return;
    setLanes((current) => current.map((lane) => {
      const width = Math.min(selectedLane.width, 100 - lane.left);
      const top = clamp(selectedLane.top, 0, 100 - selectedLane.height);
      const centerShiftX = (width - lane.width) / 2;
      const centerShiftY = top + selectedLane.height / 2 - (lane.top + lane.height / 2);
      return {
        ...lane,
        top,
        width,
        height: selectedLane.height,
        boxRotation: selectedLane.boxRotation,
        labelX: clamp(lane.labelX + centerShiftX, -20, 120),
        labelY: clamp(lane.labelY + centerShiftY, -20, 120),
      };
    }));
    setStatus('Box shape applied');
  }

  function exportFile(format: ExportFormat) {
    const source = imageUrl ? uploadedImageRef.current : demoCanvasRef.current;
    if (!source) return;
    const sourceWidth = imageUrl ? (uploadedImageRef.current?.naturalWidth || imageSize.width) : 1200;
    const sourceHeight = imageUrl ? (uploadedImageRef.current?.naturalHeight || imageSize.height) : 720;
    const cropX = Math.round((crop.left / 100) * sourceWidth);
    const cropY = Math.round((crop.top / 100) * sourceHeight);
    const cropRight = Math.round((crop.right / 100) * sourceWidth);
    const cropBottom = Math.round((crop.bottom / 100) * sourceHeight);
    const croppedWidth = Math.max(1, sourceWidth - cropX - cropRight);
    const croppedHeight = Math.max(1, sourceHeight - cropY - cropBottom);
    const scale = sourceWidth / 1200;
    const measuringContext = document.createElement('canvas').getContext('2d');
    let minimumLabelX = 0;
    let maximumLabelX = croppedWidth;
    let minimumLabelY = 0;
    let maximumLabelY = croppedHeight;

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
      const labelX = (lane.labelX / 100) * sourceWidth - cropX;
      const labelY = (lane.labelY / 100) * sourceHeight - cropY;
      minimumLabelX = Math.min(minimumLabelX, labelX - halfWidth);
      maximumLabelX = Math.max(maximumLabelX, labelX + halfWidth);
      minimumLabelY = Math.min(minimumLabelY, labelY - halfHeight);
      maximumLabelY = Math.max(maximumLabelY, labelY + halfHeight);
    });

    const leftPadding = Math.ceil(Math.max(20 * scale, -minimumLabelX + 12 * scale));
    const rightPadding = Math.ceil(Math.max(20 * scale, maximumLabelX - croppedWidth + 12 * scale));
    const topPadding = Math.ceil(Math.max(28 * scale, -minimumLabelY + 12 * scale));
    const bottomPadding = Math.ceil(Math.max(28 * scale, maximumLabelY - croppedHeight + 12 * scale));
    const outputWidth = Math.ceil(croppedWidth + leftPadding + rightPadding);
    const outputHeight = Math.ceil(croppedHeight + topPadding + bottomPadding);
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
      imageCanvas.width = croppedWidth;
      imageCanvas.height = croppedHeight;
      const imageContext = imageCanvas.getContext('2d');
      if (!imageContext || !measuringContext) return;
      imageContext.drawImage(source, cropX, cropY, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight);
      const embeddedImage = imageCanvas.toDataURL('image/png');

      const boxMarkup = lanes.map((lane) => {
        const width = (lane.width / 100) * sourceWidth;
        const height = (lane.height / 100) * sourceHeight;
        const centerX = leftPadding + ((lane.left + lane.width / 2) / 100) * sourceWidth - cropX;
        const centerY = topPadding + ((lane.top + lane.height / 2) / 100) * sourceHeight - cropY;
        return `<g transform="translate(${centerX} ${centerY}) rotate(${lane.boxRotation})"><rect x="${-width / 2}" y="${-height / 2}" width="${width}" height="${height}" fill="${escapeXml(lane.color)}" fill-opacity=".035" stroke="${escapeXml(lane.color)}" stroke-width="${Math.max(2, 2 * scale)}"/></g>`;
      }).join('');

      const labelMarkup = lanes.map((lane) => {
        const fontSize = lane.fontSize * scale;
        const fontFamily = FONT_STACKS[lane.fontFamily] ?? FONT_STACKS.Manrope;
        const text = lane.label || `Lane ${lane.id}`;
        measuringContext.font = `${lane.italic ? 'italic ' : ''}${lane.bold ? '700 ' : '400 '}${fontSize}px ${fontFamily}`;
        const textWidth = measuringContext.measureText(text).width;
        const padding = 5 * scale;
        const labelX = leftPadding + (lane.labelX / 100) * sourceWidth - cropX;
        const labelY = topPadding + (lane.labelY / 100) * sourceHeight - cropY;
        return `<g transform="translate(${labelX} ${labelY}) rotate(${lane.rotation})"><rect x="${-textWidth / 2 - padding}" y="${-fontSize * 0.65}" width="${textWidth + padding * 2}" height="${fontSize * 1.25}" fill="#fff" fill-opacity=".92"/><text x="0" y="0" dominant-baseline="middle" text-anchor="middle" fill="${escapeXml(lane.labelColor)}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="${lane.bold ? 700 : 400}" font-style="${lane.italic ? 'italic' : 'normal'}" text-decoration="${lane.underline ? 'underline' : 'none'}">${escapeXml(text)}</text></g>`;
      }).join('');

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${outputWidth}" height="${outputHeight}" viewBox="0 0 ${outputWidth} ${outputHeight}"><defs><clipPath id="gel-image"><rect x="${leftPadding}" y="${topPadding}" width="${croppedWidth}" height="${croppedHeight}"/></clipPath></defs><rect width="100%" height="100%" fill="#fff"/><image href="${embeddedImage}" x="${leftPadding}" y="${topPadding}" width="${croppedWidth}" height="${croppedHeight}" preserveAspectRatio="none"/><g clip-path="url(#gel-image)">${boxMarkup}</g>${labelMarkup}</svg>`;
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
    context.drawImage(source, cropX, cropY, croppedWidth, croppedHeight, leftPadding, topPadding, croppedWidth, croppedHeight);

    lanes.forEach((lane) => {
      const width = (lane.width / 100) * sourceWidth;
      const height = (lane.height / 100) * sourceHeight;
      const centerX = leftPadding + ((lane.left + lane.width / 2) / 100) * sourceWidth - cropX;
      const centerY = topPadding + ((lane.top + lane.height / 2) / 100) * sourceHeight - cropY;
      context.save();
      context.beginPath();
      context.rect(leftPadding, topPadding, croppedWidth, croppedHeight);
      context.clip();
      context.translate(centerX, centerY);
      context.rotate((lane.boxRotation * Math.PI) / 180);
      context.fillStyle = alpha(lane.color, 0.035);
      context.fillRect(-width / 2, -height / 2, width, height);
      context.strokeStyle = lane.color;
      context.lineWidth = Math.max(2, 2 * scale);
      context.strokeRect(-width / 2, -height / 2, width, height);
      context.restore();

      const fontSize = lane.fontSize * scale;
      context.font = `${lane.italic ? 'italic ' : ''}${lane.bold ? '700 ' : '400 '}${fontSize}px ${lane.fontFamily}`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = lane.labelColor;
      context.save();
      context.translate(leftPadding + (lane.labelX / 100) * sourceWidth - cropX, topPadding + (lane.labelY / 100) * sourceHeight - cropY);
      context.rotate((lane.rotation * Math.PI) / 180);
      const metrics = context.measureText(lane.label || `Lane ${lane.id}`);
      const padding = 5 * scale;
      context.fillStyle = 'rgba(255,255,255,.9)';
      context.fillRect(-metrics.width / 2 - padding, -fontSize * 0.65, metrics.width + padding * 2, fontSize * 1.25);
      context.fillStyle = lane.labelColor;
      context.fillText(lane.label || `Lane ${lane.id}`, 0, 0);
      if (lane.underline) {
        context.beginPath();
        context.moveTo(-metrics.width / 2, fontSize * 0.42);
        context.lineTo(metrics.width / 2, fontSize * 0.42);
        context.strokeStyle = lane.labelColor;
        context.lineWidth = Math.max(1, fontSize / 16);
        context.stroke();
      }
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
  const croppedDimensions = {
    width: Math.max(1, Math.round(imageSize.width * (100 - crop.left - crop.right) / 100)),
    height: Math.max(1, Math.round(imageSize.height * (100 - crop.top - crop.bottom) / 100)),
  };

  return (
    <main className="app-shell min-h-screen bg-background text-foreground">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <img src="/lab-portrait-logo.png" alt="" />
          </span>
          <p className="brand-name"><span>Lane</span><span>Studio</span></p>
        </div>

        <div className="toolbar" aria-label="Canvas controls">
          <label className="upload-button">
            <Upload className="size-4" />
            <span>Upload</span>
            <input className="sr-only" type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files?.[0])} />
          </label>
          <Button variant="outline" className="toolbar-button" onClick={addLane}><Plus /> Add</Button>
          <Button variant="outline" className="toolbar-button optional-control" onClick={distributeLanes} disabled={lanes.length < 2}><AlignHorizontalDistributeCenter /> Even spacing</Button>
          <Button variant="outline" className="toolbar-button optional-control" onClick={alignLabels} disabled={lanes.length < 2} title="Align every label to the selected label"><AlignVerticalJustifyCenter /> Align all</Button>
          <Button variant="outline" className="toolbar-button optional-control" onClick={tidyForExport} disabled={lanes.length < 2} title="Align labels and distribute them evenly"><ScanLine /> Tidy export</Button>
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

          <div className="crop-block">
            <div className="crop-heading">
              <span><Crop /> Image crop (%)</span>
              <button type="button" onClick={() => { setCrop(DEFAULT_CROP); setStatus('Crop reset'); }}>Reset</button>
            </div>
            <div className="crop-grid">
              {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                <label key={side}>
                  <span>{side}</span>
                  <Input
                    aria-label={`Crop ${side}`}
                    type="number"
                    min={0}
                    max={95}
                    step={0.5}
                    value={Number(crop[side].toFixed(1))}
                    onChange={(event) => updateCrop(side, Number(event.target.value))}
                  />
                </label>
              ))}
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
            <Button variant="outline" size="sm" onClick={distributeLanes} disabled={lanes.length < 2}><AlignHorizontalDistributeCenter /> Even spacing</Button>
            <Button variant="outline" size="sm" onClick={equalizeWidths} disabled={!lanes.length}><Equal /> Same width</Button>
            <Button variant="outline" size="sm" className="auto-fit-button" onClick={fitLaneGrid} disabled={!lanes.length}><ScanLine /> Auto fit boxes</Button>
            <Button variant="outline" size="sm" className="align-labels-button" onClick={alignLabels} disabled={lanes.length < 2} title="Align every label to the selected label"><AlignVerticalJustifyCenter /> Align all labels</Button>
            <Button variant="outline" size="sm" className="tidy-layout-button" onClick={tidyForExport} disabled={lanes.length < 2} title="Align labels and distribute them evenly"><ScanLine /> Tidy export</Button>
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
            <span className="pixel-badge">{croppedDimensions.width} × {croppedDimensions.height} px</span>
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
                  style={{
                    left: `${lane.left}%`,
                    top: `${lane.top}%`,
                    width: `${lane.width}%`,
                    height: `${lane.height}%`,
                    borderColor: lane.color,
                    background: alpha(lane.color, 0.035),
                    transform: `rotate(${lane.boxRotation}deg)`,
                  }}
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
                  <span className="resize-handle top" data-mode="resize-top" aria-hidden="true" />
                  <span className="resize-handle bottom" data-mode="resize-bottom" aria-hidden="true" />
                  <span className="resize-handle corner top-left" data-mode="resize-top-left" aria-hidden="true" />
                  <span className="resize-handle corner top-right" data-mode="resize-top-right" aria-hidden="true" />
                  <span className="resize-handle corner bottom-left" data-mode="resize-bottom-left" aria-hidden="true" />
                  <span className="resize-handle corner bottom-right" data-mode="resize-bottom-right" aria-hidden="true" />
                  <span className="rotate-handle" data-mode="rotate" aria-hidden="true"><RotateCw /></span>
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
                    textDecoration: lane.underline ? 'underline' : 'none',
                    transform: `translate(-50%, -50%) rotate(${lane.rotation}deg)`,
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${lane.label || `Lane ${index + 1}`} label. Drag to move; use the square handle to resize and the round handle to rotate.`}
                  onPointerDown={(event) => startLabelDrag(event, lane)}
                  onPointerMove={moveLabelDrag}
                  onPointerUp={endLabelDrag}
                  onPointerCancel={endLabelDrag}
                  onKeyDown={(event) => nudgeLabel(event, lane)}
                  onFocus={() => setSelectedId(lane.id)}
                >
                  <span className="lane-label-text">{lane.label || `Lane ${index + 1}`}</span>
                  <span className="label-transform-handle label-size-handle" data-label-mode="resize" aria-hidden="true"><Maximize2 /></span>
                  <span className="label-transform-handle label-rotate-handle" data-label-mode="rotate" aria-hidden="true"><RotateCw /></span>
                </span>
              ))}

              {crop.top > 0 && <span className="crop-shade top" style={{ height: `${crop.top}%` }} />}
              {crop.bottom > 0 && <span className="crop-shade bottom" style={{ height: `${crop.bottom}%` }} />}
              {crop.left > 0 && <span className="crop-shade left" style={{ top: `${crop.top}%`, bottom: `${crop.bottom}%`, width: `${crop.left}%` }} />}
              {crop.right > 0 && <span className="crop-shade right" style={{ top: `${crop.top}%`, bottom: `${crop.bottom}%`, width: `${crop.right}%` }} />}
              <span className="crop-outline" style={{ top: `${crop.top}%`, right: `${crop.right}%`, bottom: `${crop.bottom}%`, left: `${crop.left}%` }}>
                {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                  <span
                    key={side}
                    className={`crop-handle ${side}`}
                    aria-hidden="true"
                    onPointerDown={(event) => startCropDrag(event, side)}
                    onPointerMove={moveCropDrag}
                    onPointerUp={endCropDrag}
                    onPointerCancel={endCropDrag}
                  />
                ))}
              </span>
            </div>
          </div>
          <div className="canvas-help"><span>⌘/Ctrl+B · I · U</span><span>⌘/Ctrl+C/V</span><span>⌘/Ctrl+Z/Y</span><span>⌘/Ctrl+S export</span><span>Arrows: nudge</span></div>
        </section>

        <aside className="inspector-panel">
          <div className="inspector-heading"><SlidersHorizontal /><div><p className="panel-kicker">Lane</p><h2>{selectedLane?.label || 'None'}</h2></div></div>

          {selectedLane ? (
            <div className="inspector-fields">
              <div className="geometry-block">
                <div className="field-label-row"><label>Lane box</label><output>X / Y / W / H %</output></div>
                <div className="geometry-grid">
                  <label><span>X</span><Input aria-label="Box horizontal position" type="number" min={0} max={100 - selectedLane.width} step={0.1} value={Number(selectedLane.left.toFixed(1))} onChange={(event) => updateLaneBox(selectedLane.id, { left: clamp(Number(event.target.value), 0, 100 - selectedLane.width) })} /></label>
                  <label><span>Y</span><Input aria-label="Box vertical position" type="number" min={0} max={100 - selectedLane.height} step={0.1} value={Number(selectedLane.top.toFixed(1))} onChange={(event) => updateLaneBox(selectedLane.id, { top: clamp(Number(event.target.value), 0, 100 - selectedLane.height) })} /></label>
                  <label><span>W</span><Input aria-label="Box width" type="number" min={1.5} max={100 - selectedLane.left} step={0.1} value={Number(selectedLane.width.toFixed(1))} onChange={(event) => updateLaneBox(selectedLane.id, { width: clamp(Number(event.target.value), 1.5, 100 - selectedLane.left) })} /></label>
                  <label><span>H</span><Input aria-label="Box height" type="number" min={2} max={100 - selectedLane.top} step={0.1} value={Number(selectedLane.height.toFixed(1))} onChange={(event) => updateLaneBox(selectedLane.id, { height: clamp(Number(event.target.value), 2, 100 - selectedLane.top) })} /></label>
                </div>
                <div className="geometry-actions">
                  <Button variant="outline" size="sm" onClick={() => {
                    const layout = getGridLayout(Math.max(1, lanes.length));
                    updateLaneBox(selectedLane.id, { top: layout.top, height: layout.height, boxRotation: 0 });
                  }}>Reset shape</Button>
                  <Button variant="outline" size="sm" onClick={applyBoxToAll}><Copy /> Copy to all</Button>
                </div>
              </div>

              <div className="field-group">
                <div className="field-label-row"><label htmlFor="box-angle">Box angle</label><output>{selectedLane.boxRotation.toFixed(1)}°</output></div>
                <Slider id="box-angle" min={-60} max={60} step={0.5} value={[selectedLane.boxRotation]} onValueChange={(value) => updateLaneBox(selectedLane.id, { boxRotation: Array.isArray(value) ? Number(value[0]) : Number(value) })} />
              </div>

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
                <Slider id="font-size" min={8} max={72} step={1} value={[selectedLane.fontSize]} onValueChange={(value) => updateLane(selectedLane.id, { fontSize: Array.isArray(value) ? Number(value[0]) : Number(value) })} />
              </div>

              <div className="format-row">
                <div className="field-group grow">
                  <label>Style</label>
                  <div className="toggle-pair">
                    <Toggle variant="outline" pressed={selectedLane.bold} onPressedChange={(pressed) => updateLane(selectedLane.id, { bold: pressed })} aria-label="Bold"><Bold /></Toggle>
                    <Toggle variant="outline" pressed={selectedLane.italic} onPressedChange={(pressed) => updateLane(selectedLane.id, { italic: pressed })} aria-label="Italic"><Italic /></Toggle>
                    <Toggle variant="outline" pressed={selectedLane.underline} onPressedChange={(pressed) => updateLane(selectedLane.id, { underline: pressed })} aria-label="Underline"><Underline /></Toggle>
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
                    {![0, -30, -45, -60, -90].includes(selectedLane.rotation) && <NativeSelectOption value={String(selectedLane.rotation)}>{selectedLane.rotation}°</NativeSelectOption>}
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
      <footer className="software-copyright">© 2026 Katharina Julia Brenner</footer>
      <span className="sr-only" role="status" aria-live="polite">{status}</span>
    </main>
  );
}
