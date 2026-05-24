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
    selectElement(element.id);
    onDragStart(element.id, e);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (element.type === 'text') {
      setIsEditing(true);
      setTimeout(() => {
        if (textRef.current) {
          textRef.current.focus();
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(textRef.current);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 0);
    }
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
              cursor: isEditing ? 'text' : 'move',
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
        cursor: isEditing ? 'text' : 'move',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {renderContent()}

      {isSelected && !isEditing && (
        <>
          <div className="resize-handle" style={{ top: -4, left: -4, cursor: 'nw-resize' }} onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <div className="resize-handle" style={{ top: -4, right: -4, cursor: 'ne-resize' }} onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className="resize-handle" style={{ bottom: -4, left: -4, cursor: 'sw-resize' }} onMouseDown={(e) => handleResizeStart(e, 'sw')} />
          <div className="resize-handle" style={{ bottom: -4, right: -4, cursor: 'se-resize' }} onMouseDown={(e) => handleResizeStart(e, 'se')} />
          <div className="resize-handle" style={{ top: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' }} onMouseDown={(e) => handleResizeStart(e, 'n')} />
          <div className="resize-handle" style={{ bottom: -4, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' }} onMouseDown={(e) => handleResizeStart(e, 's')} />
          <div className="resize-handle" style={{ top: '50%', left: -4, transform: 'translateY(-50%)', cursor: 'w-resize' }} onMouseDown={(e) => handleResizeStart(e, 'w')} />
          <div className="resize-handle" style={{ top: '50%', right: -4, transform: 'translateY(-50%)', cursor: 'e-resize' }} onMouseDown={(e) => handleResizeStart(e, 'e')} />
          <div className="rotate-handle" onMouseDown={handleRotateStart} title="旋转" />
        </>
      )}
    </div>
  );
}
