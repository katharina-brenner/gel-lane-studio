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
};

type DragState = {
  id: number;
  mode: 'move' | 'resize-left' | 'resize-right';
  startX: number;
  startLeft: number;
  startWidth: number;
  stageWidth: number;
};

const INITIAL_LANES: Lane[] = [
  { id: 1, left: 5, width: 8.8, label: 'Marker', color: '#2856f6', labelColor: '#173fc5', fontSize: 17, fontFamily: 'Manrope', bold: true, italic: false, rotation: -45, labelPosition: 'top' },
  { id: 2, left: 15, width: 8.8, label: 'Control', color: '#2856f6', labelColor: '#173fc5', fontSize: 17, fontFamily: 'Manrope', bold: true, italic: false, rotation: -45, labelPosition: 'top' },
  { id: 3, left: 25, width: 8.8, label: 'Sample A', color: '#2856f6', labelColor: '#173fc5', fontSize: 17, fontFamily: 'Manrope', bold: true, italic: false, rotation: -45, labelPosition: 'top' },
  { id: 4, left: 35, width: 8.8, label: 'Sample B', color: '#2856f6', labelColor: '#173fc5', fontSize: 17, fontFamily: 'Manrope', bold: true, italic: false, rotation: -45, labelPosition: 'top' },
  { id: 5, left: 45, width: 8.8, label: 'Sample C', color: '#2856f6', labelColor: '#173fc5', fontSize: 17, fontFamily: 'Manrope', bold: true, italic: false, rotation: -45, labelPosition: 'top' },
  { id: 6, left: 55, width: 8.8, label: 'Treatment 1', color: '#2856f6', labelColor: '#173fc5', fontSize: 17, fontFamily: 'Manrope', bold: true, italic: false, rotation: -45, labelPosition: 'top' },
  { id: 7, left: 65, width: 8.8, label: 'Treatment 2', color: '#f4542f', labelColor: '#d33b20', fontSize: 17, fontFamily: 'Manrope', bold: true, italic: false, rotation: -45, labelPosition: 'top' },
  { id: 8, left: 75, width: 8.8, label: 'Treatment 3', color: '#2856f6', labelColor: '#173fc5', fontSize: 17, fontFamily: 'Manrope', bold: true, italic: false, rotation: -45, labelPosition: 'top' },
  { id: 9, left: 85, width: 8.8, label: 'Treatment 4', color: '#2856f6', labelColor: '#173fc5', fontSize: 17, fontFamily: 'Manrope', bold: true, italic: false, rotation: -45, labelPosition: 'top' },
];

const FONT_STACKS: Record<string, string> = {
  Manrope: 'var(--font-manrope), Arial, sans-serif',
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
  const objectUrlRef = useRef<string | null>(null);
  const nextIdRef = useRef(10);

  const [lanes, setLanes] = useState<Lane[]>(INITIAL_LANES);
  const [selectedId, setSelectedId] = useState(7);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 1200, height: 720 });
  const [projectName, setProjectName] = useState('Demo gel');
  const [laneCount, setLaneCount] = useState(9);
  const [status, setStatus] = useState('Demo');

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
    const freshLanes = Array.from({ length: safeCount }, (_, index): Lane => ({
      id: nextIdRef.current++,
      label: index === 0 ? 'Marker' : `Lane ${index + 1}`,
      left: margin + index * (width + gap),
      width,
      color: '#2856f6',
      labelColor: '#173fc5',
      fontSize: 17,
      fontFamily: 'Manrope',
      bold: true,
      italic: false,
      rotation: safeCount > 7 ? -45 : 0,
      labelPosition: 'top',
    }));
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
      color: selectedLane?.color ?? '#2856f6',
      labelColor: selectedLane?.labelColor ?? '#173fc5',
      fontSize: selectedLane?.fontSize ?? 17,
      fontFamily: selectedLane?.fontFamily ?? 'Manrope',
      bold: selectedLane?.bold ?? true,
      italic: selectedLane?.italic ?? false,
      rotation: selectedLane?.rotation ?? 0,
      labelPosition: selectedLane?.labelPosition ?? 'top',
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
    setLanes((current) => current.map((lane) => ({ ...lane, left: positions.get(lane.id) ?? lane.left })));
    setStatus('Distributed');
  }

  function equalizeWidths() {
    if (!lanes.length) return;
    const width = lanes.reduce((sum, lane) => sum + lane.width, 0) / lanes.length;
    setLanes((current) => current.map((lane) => ({ ...lane, width: Math.min(width, 100 - lane.left) })));
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
    dragRef.current = { id: lane.id, mode, startX: event.clientX, startLeft: lane.left, startWidth: lane.width, stageWidth: bounds.width };
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id !== Number(event.currentTarget.dataset.laneId)) return;
    const delta = ((event.clientX - drag.startX) / drag.stageWidth) * 100;
    if (drag.mode === 'move') {
      updateLane(drag.id, { left: clamp(drag.startLeft + delta, 0, 100 - drag.startWidth) });
    } else if (drag.mode === 'resize-left') {
      const left = clamp(drag.startLeft + delta, 0, drag.startLeft + drag.startWidth - 1.5);
      updateLane(drag.id, { left, width: drag.startWidth + drag.startLeft - left });
    } else {
      updateLane(drag.id, { width: clamp(drag.startWidth + delta, 1.5, 100 - drag.startLeft) });
    }
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      dragRef.current = null;
      setStatus('Moved');
    }
  }

  function nudgeLane(event: React.KeyboardEvent<HTMLDivElement>, lane: Lane) {
    const step = event.shiftKey ? 1 : 0.2;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      updateLane(lane.id, { left: clamp(lane.left + (event.key === 'ArrowRight' ? step : -step), 0, 100 - lane.width) });
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      deleteLane(lane.id);
    }
  }

  function applyStyleToAll() {
    if (!selectedLane) return;
    const { color, labelColor, fontSize, fontFamily, bold, italic, rotation, labelPosition } = selectedLane;
    setLanes((current) => current.map((lane) => ({ ...lane, color, labelColor, fontSize, fontFamily, bold, italic, rotation, labelPosition })));
    setStatus('Style applied');
  }

  function exportPng() {
    const source = imageUrl ? uploadedImageRef.current : demoCanvasRef.current;
    if (!source) return;
    const sourceWidth = imageUrl ? (uploadedImageRef.current?.naturalWidth || imageSize.width) : 1200;
    const sourceHeight = imageUrl ? (uploadedImageRef.current?.naturalHeight || imageSize.height) : 720;
    const scale = sourceWidth / 1200;
    const topPadding = Math.max(110 * scale, sourceHeight * 0.2);
    const bottomPadding = Math.max(35 * scale, sourceHeight * 0.05);
    const output = document.createElement('canvas');
    output.width = sourceWidth;
    output.height = Math.ceil(sourceHeight + topPadding + bottomPadding);
    const context = output.getContext('2d');
    if (!context) return;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, output.width, output.height);
    context.drawImage(source, 0, topPadding, sourceWidth, sourceHeight);

    lanes.forEach((lane) => {
      const x = (lane.left / 100) * sourceWidth;
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
      let labelY = topPadding - Math.max(18 * scale, fontSize * 0.9);
      if (lane.labelPosition === 'inside') labelY = topPadding + Math.max(22 * scale, fontSize);
      if (lane.labelPosition === 'bottom') labelY = topPadding + sourceHeight + Math.max(16 * scale, fontSize * 0.75);
      context.save();
      context.translate(x + width / 2, labelY);
      context.rotate((lane.rotation * Math.PI) / 180);
      const metrics = context.measureText(lane.label || `Lane ${lane.id}`);
      const padding = 5 * scale;
      context.fillStyle = 'rgba(255,255,255,.9)';
      context.fillRect(-metrics.width / 2 - padding, -fontSize * 0.65, metrics.width + padding * 2, fontSize * 1.25);
      context.fillStyle = lane.labelColor;
      context.fillText(lane.label || `Lane ${lane.id}`, 0, 0);
      context.restore();
    });

    output.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${projectName || 'gel'}-annotated.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      setStatus('PNG exported');
    }, 'image/png');
  }

  const mediaAspect = `${imageSize.width} / ${imageSize.height}`;

  return (
    <main className="app-shell min-h-screen bg-background text-foreground">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <p className="brand-name">Lane Studio</p>
        </div>

        <div className="toolbar" aria-label="Canvas controls">
          <label className="upload-button">
            <Upload className="size-4" />
            <span>Upload</span>
            <input className="sr-only" type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files?.[0])} />
          </label>
          <Button variant="outline" className="toolbar-button" onClick={addLane}><Plus /> Add</Button>
          <Button variant="outline" className="toolbar-button optional-control" onClick={distributeLanes} disabled={lanes.length < 2}><AlignHorizontalDistributeCenter /> Distribute</Button>
          <Button className="toolbar-button export-button" onClick={exportPng}><Download /> Export</Button>
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
                  <span
                    className={`lane-label lane-label-${lane.labelPosition}`}
                    style={{
                      color: lane.labelColor,
                      fontFamily: FONT_STACKS[lane.fontFamily] ?? FONT_STACKS.Manrope,
                      fontSize: `${lane.fontSize}px`,
                      fontWeight: lane.bold ? 700 : 400,
                      fontStyle: lane.italic ? 'italic' : 'normal',
                      transform: `translateX(-50%) rotate(${lane.rotation}deg)`,
                    }}
                  >
                    {lane.label || `Lane ${index + 1}`}
                  </span>
                  <span className="resize-handle left" data-mode="resize-left" aria-hidden="true" />
                  <span className="resize-handle right" data-mode="resize-right" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
          <div className="canvas-help"><span>Drag</span><span>Handles: resize</span><span>← →: nudge</span></div>
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
                  <NativeSelect id="label-position" className="w-full" value={selectedLane.labelPosition} onChange={(event) => updateLane(selectedLane.id, { labelPosition: event.target.value as LabelPosition })}>
                    <NativeSelectOption value="top">Above</NativeSelectOption>
                    <NativeSelectOption value="inside">Inside</NativeSelectOption>
                    <NativeSelectOption value="bottom">Below</NativeSelectOption>
                  </NativeSelect>
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
