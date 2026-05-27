import { useRef, useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '../store';
import CanvasElement from './CanvasElement';
import ContextMenu from './ContextMenu';

interface GuideLine {
  type: 'h' | 'v';
  position: number;
}

export default function Canvas() {
  const {
    canvasWidth,
    canvasHeight,
    backgroundColor,
    backgroundImage,
    elements,
    selectedElementId,
    zoom,
    tool,
    selectElement,
    addTextElement,
    updateElement,
    setTool,
  } = useEditorStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [drawRect, setDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [guideLines, setGuideLines] = useState<GuideLine[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string } | null>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    elementId: string;
    startX: number;
    startY: number;
    elementStartX: number;
    elementStartY: number;
  } | null>(null);

  const scale = zoom / 100;

  const getCanvasCoords = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  }, [scale]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (contextMenu) {
      setContextMenu(null);
      return;
    }

    const coords = getCanvasCoords(e);

    if (tool === 'text') {
      setIsDrawing(true);
      setDrawStart(coords);
      setDrawRect({ x: coords.x, y: coords.y, w: 0, h: 0 });
      return;
    }

    const target = e.target as HTMLElement;
    const elementEl = target.closest('[data-element-id]');
    if (!elementEl) {
      selectElement(null);
    }
  }, [tool, getCanvasCoords, selectElement, contextMenu]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDrawing && tool === 'text') {
      const coords = getCanvasCoords(e);
      setDrawRect({
        x: Math.min(drawStart.x, coords.x),
        y: Math.min(drawStart.y, coords.y),
        w: Math.abs(coords.x - drawStart.x),
        h: Math.abs(coords.y - drawStart.y),
      });
      return;
    }

    if (dragState?.isDragging) {
      const coords = getCanvasCoords(e);
      const dx = coords.x - dragState.startX;
      const dy = coords.y - dragState.startY;
      const newX = dragState.elementStartX + dx;
      const newY = dragState.elementStartY + dy;

      const newGuides: GuideLine[] = [];
      const element = elements.find(el => el.id === dragState.elementId);
      if (element) {
        const centerX = newX + element.width / 2;
        const centerY = newY + element.height / 2;
        const canvasCenterX = canvasWidth / 2;
        const canvasCenterY = canvasHeight / 2;

        if (Math.abs(centerX - canvasCenterX) < 5) {
          newGuides.push({ type: 'v', position: canvasCenterX });
        }
        if (Math.abs(centerY - canvasCenterY) < 5) {
          newGuides.push({ type: 'h', position: canvasCenterY });
        }

        elements.forEach(el => {
          if (el.id === dragState.elementId) return;
          const elCenterX = el.x + el.width / 2;
          const elCenterY = el.y + el.height / 2;
          if (Math.abs(centerX - elCenterX) < 5) {
            newGuides.push({ type: 'v', position: elCenterX });
          }
          if (Math.abs(centerY - elCenterY) < 5) {
            newGuides.push({ type: 'h', position: elCenterY });
          }
        });
      }

      setGuideLines(newGuides);
      updateElement(dragState.elementId, { x: newX, y: newY });
    }
  }, [isDrawing, tool, drawStart, getCanvasCoords, dragState, elements, canvasWidth, canvasHeight, updateElement]);

  const handleCanvasMouseUp = useCallback(() => {
    if (isDrawing && tool === 'text' && drawRect) {
      const w = Math.max(drawRect.w, 100);
      const h = Math.max(drawRect.h, 30);
      addTextElement(drawRect.x, drawRect.y, w, h);
      setIsDrawing(false);
      setDrawRect(null);
      setTool(null);
      return;
    }

    if (dragState?.isDragging) {
      setDragState(null);
      setGuideLines([]);
    }
    setIsDrawing(false);
    setDrawRect(null);
  }, [isDrawing, tool, drawRect, addTextElement, setTool, dragState]);

  const handleElementDragStart = useCallback((elementId: string, e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    selectElement(elementId);
    setDragState({
      isDragging: true,
      elementId,
      startX: coords.x,
      startY: coords.y,
      elementStartX: element.x,
      elementStartY: element.y,
    });
  }, [getCanvasCoords, elements, selectElement]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const elementEl = target.closest('[data-element-id]');
    if (elementEl) {
      const elementId = elementEl.getAttribute('data-element-id')!;
      selectElement(elementId);
      setContextMenu({ x: e.clientX, y: e.clientY, elementId });
    }
  }, [selectElement]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        useEditorStore.getState().undo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        useEditorStore.getState().redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        const { selectedElementId, deleteElement } = useEditorStore.getState();
        if (selectedElementId) {
          e.preventDefault();
          deleteElement(selectedElementId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const { zoom, setZoom } = useEditorStore.getState();
        const delta = e.deltaY > 0 ? -10 : 10;
        setZoom(Math.max(10, Math.min(200, zoom + delta)));
      }
    };
    const container = document.querySelector('.canvas-container') as HTMLElement | null;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);

  return (
    <>
      <div
        className="inline-block"
        style={{
          padding: '40px',
          minWidth: '100%',
          minHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: canvasWidth * scale,
            height: canvasHeight * scale,
            flexShrink: 0,
          }}
        >
          <div
            id="poster-canvas"
            ref={canvasRef}
            className="relative shadow-2xl"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              backgroundColor,
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: tool === 'text' ? 'crosshair' : 'default',
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onContextMenu={handleContextMenu}
          >
        {elements.map((element) => (
          <CanvasElement
            key={element.id}
            element={element}
            isSelected={element.id === selectedElementId}
            onDragStart={handleElementDragStart}
          />
        ))}

        {drawRect && drawRect.w > 0 && drawRect.h > 0 && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-50/30 pointer-events-none"
            style={{
              left: drawRect.x,
              top: drawRect.y,
              width: drawRect.w,
              height: drawRect.h,
            }}
          />
        )}

        {guideLines.map((line, i) => (
          <div
            key={i}
            className={`guide-line ${line.type === 'h' ? 'guide-line-h' : 'guide-line-v'}`}
            style={line.type === 'h' ? { top: line.position } : { left: line.position }}
          />
        ))}
          </div>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          elementId={contextMenu.elementId}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
