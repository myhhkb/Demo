import { useState, useRef, useCallback, useEffect } from 'react';
import { CanvasElement as CanvasElementType, TextElement, ShapeElement, ImageElement } from '../types';
import { useEditorStore } from '../store';

interface Props {
  element: CanvasElementType;
  isSelected: boolean;
  onDragStart: (elementId: string, e: React.MouseEvent) => void;
}

export default function CanvasElement({ element, isSelected, onDragStart }: Props) {
  const { updateElement, selectElement } = useEditorStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditing) return;

    // For text elements that are already selected, clicking inside content area enters edit mode
    if (element.type === 'text' && isSelected) {
      const rect = elementRef.current?.getBoundingClientRect();
      if (rect) {
        const borderZone = 8;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const isOnBorder = x < borderZone || x > rect.width - borderZone || y < borderZone || y > rect.height - borderZone;
        if (!isOnBorder) {
          setIsEditing(true);
          setTimeout(() => {
            if (textRef.current) {
              textRef.current.focus();
            }
          }, 0);
          return;
        }
      }
    }

    selectElement(element.id);
    onDragStart(element.id, e);
  };

  const handleTextBlur = () => {
    if (isEditing && textRef.current) {
      const content = textRef.current.innerText;
      updateElement(element.id, { content } as Partial<TextElement>);
      setIsEditing(false);
    }
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = element.width;
    const startHeight = element.height;
    const startElX = element.x;
    const startElY = element.y;
    const zoom = useEditorStore.getState().zoom / 100;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startElX;
      let newY = startElY;

      if (direction.includes('e')) newWidth = Math.max(20, startWidth + dx);
      if (direction.includes('w')) {
        newWidth = Math.max(20, startWidth - dx);
        newX = startElX + (startWidth - newWidth);
      }
      if (direction.includes('s')) newHeight = Math.max(20, startHeight + dy);
      if (direction.includes('n')) {
        newHeight = Math.max(20, startHeight - dy);
        newY = startElY + (startHeight - newHeight);
      }

      updateElement(element.id, { width: newWidth, height: newHeight, x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(true);

    const rect = elementRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
      const degrees = (angle * 180) / Math.PI + 90;
      updateElement(element.id, { rotation: Math.round(degrees) });
    };

    const handleMouseUp = () => {
      setIsRotating(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getShadowStyle = (el: TextElement | ShapeElement | ImageElement) => {
    if (!el.shadow) return '';
    return `${el.shadowOffsetX}px ${el.shadowOffsetY}px ${el.shadowBlur}px ${el.shadowColor}`;
  };

  const renderContent = () => {
    switch (element.type) {
      case 'text': {
        const textEl = element as TextElement;
        return (
          <div
            ref={textRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={handleTextBlur}
            className="w-full h-full outline-none overflow-hidden"
            style={{
              fontFamily: textEl.fontFamily,
              fontSize: textEl.fontSize,
              fontWeight: textEl.fontWeight,
              fontStyle: textEl.fontStyle,
              textDecoration: textEl.textDecoration,
              textAlign: textEl.textAlign,
              color: textEl.color,
              letterSpacing: textEl.letterSpacing,
              lineHeight: textEl.lineHeight,
              textShadow: getShadowStyle(textEl),
              cursor: isEditing ? 'text' : (isSelected ? 'text' : 'move'),
              wordBreak: 'break-word',
            }}
          >
            {textEl.content}
          </div>
        );
      }
      case 'shape': {
        const shapeEl = element as ShapeElement;
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            style={{
              filter: shapeEl.shadow
                ? `drop-shadow(${shapeEl.shadowOffsetX}px ${shapeEl.shadowOffsetY}px ${shapeEl.shadowBlur}px ${shapeEl.shadowColor})`
                : undefined,
            }}
          >
            <g
              fill={shapeEl.fill}
              stroke={shapeEl.stroke || 'none'}
              strokeWidth={shapeEl.strokeWidth}
              dangerouslySetInnerHTML={{ __html: shapeEl.svgContent }}
            />
          </svg>
        );
      }
      case 'image': {
        const imgEl = element as ImageElement;
        return (
          <img
            src={imgEl.src}
            alt=""
            className="w-full h-full pointer-events-none"
            style={{
              objectFit: imgEl.objectFit,
              borderRadius: imgEl.borderRadius,
              boxShadow: imgEl.shadow ? getShadowStyle(imgEl) : undefined,
            }}
            draggable={false}
          />
        );
      }
    }
  };

  return (
    <div
      ref={elementRef}
      data-element-id={element.id}
      className={`absolute ${isSelected ? 'element-selected' : ''}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        transform: `rotate(${element.rotation}deg)`,
        opacity: element.opacity,
        zIndex: element.zIndex,
        cursor: isEditing ? 'text' : (element.type === 'text' && isSelected ? 'text' : 'move'),
      }}
      onMouseDown={handleMouseDown}
    >
      {renderContent()}

      {isSelected && !isEditing && (
        <>
          {/* 四角控制手柄 */}
          <div className="resize-handle" style={{ top: -5, left: -5, cursor: 'nw-resize' }} onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <div className="resize-handle" style={{ top: -5, right: -5, cursor: 'ne-resize' }} onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className="resize-handle" style={{ bottom: -5, left: -5, cursor: 'sw-resize' }} onMouseDown={(e) => handleResizeStart(e, 'sw')} />
          <div className="resize-handle" style={{ bottom: -5, right: -5, cursor: 'se-resize' }} onMouseDown={(e) => handleResizeStart(e, 'se')} />
          {/* 四边中点控制手柄 */}
          <div className="resize-handle" style={{ top: -5, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' }} onMouseDown={(e) => handleResizeStart(e, 'n')} />
          <div className="resize-handle" style={{ bottom: -5, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' }} onMouseDown={(e) => handleResizeStart(e, 's')} />
          <div className="resize-handle" style={{ top: '50%', left: -5, transform: 'translateY(-50%)', cursor: 'w-resize' }} onMouseDown={(e) => handleResizeStart(e, 'w')} />
          <div className="resize-handle" style={{ top: '50%', right: -5, transform: 'translateY(-50%)', cursor: 'e-resize' }} onMouseDown={(e) => handleResizeStart(e, 'e')} />
          {/* 旋转手柄连接线 */}
          <div className="rotate-handle-line" />
          {/* 旋转手柄 */}
          <div className="rotate-handle" onMouseDown={handleRotateStart} title="旋转">
            <svg className="w-3 h-3 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
