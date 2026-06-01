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
    addShapeElement,
    addImageElement,
    updateElement,
    setTool,
  } = useEditorStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

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
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);

  // Space bar panning
  const [spaceHeld, setSpaceHeld] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target as HTMLElement).isContentEditable && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpaceHeld(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    if (spaceHeld && containerRef.current) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({
        x: e.clientX,
        y: e.clientY,
        scrollLeft: containerRef.current.scrollLeft,
        scrollTop: containerRef.current.scrollTop,
      });
    }
  }, [spaceHeld]);

  const handleContainerMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && containerRef.current) {
      containerRef.current.scrollLeft = panStart.scrollLeft - (e.clientX - panStart.x);
      containerRef.current.scrollTop = panStart.scrollTop - (e.clientY - panStart.y);
    }
  }, [isPanning, panStart]);

  const handleContainerMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const getCursor = () => {
    if (spaceHeld) return isPanning ? 'grabbing' : 'grab';
    if (tool === 'text') return 'crosshair';
    return 'default';
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const shapeSvg = e.dataTransfer.getData('application/poster-shape');
    if (shapeSvg) {
      addShapeElement(shapeSvg, x - 60, y - 60);
      return;
    }

    const imageSrc = e.dataTransfer.getData('application/poster-image');
    if (imageSrc) {
      addImageElement(imageSrc, x - 100, y - 100);
      return;
    }
  }, [scale, addShapeElement, addImageElement]);

  return (
    <>
      <div
        ref={containerRef}
        className="canvas-pan-container"
        style={{ cursor: getCursor() }}
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        onMouseLeave={handleContainerMouseUp}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '60px',
            minWidth: '100%',
            minHeight: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: canvasWidth * scale,
              height: canvasHeight * scale,
              margin: '0 auto',
              position: 'relative',
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
              }}
              onMouseDown={spaceHeld ? undefined : handleCanvasMouseDown}
              onMouseMove={spaceHeld ? undefined : handleCanvasMouseMove}
              onMouseUp={spaceHeld ? undefined : handleCanvasMouseUp}
              onContextMenu={handleContextMenu}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
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
