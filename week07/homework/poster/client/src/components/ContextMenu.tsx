import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store';

interface Props {
  x: number;
  y: number;
  elementId: string;
  onClose: () => void;
}

export default function ContextMenu({ x, y, elementId, onClose }: Props) {
  const { moveElementLayer, alignElement, deleteElement, canvasWidth, canvasHeight, elements } = useEditorStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuItems = [
    {
      label: '上移一层',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      ),
      action: () => { moveElementLayer(elementId, 'up'); onClose(); },
    },
    {
      label: '下移一层',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      ),
      action: () => { moveElementLayer(elementId, 'down'); onClose(); },
    },
    {
      label: '置于顶层',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
        </svg>
      ),
      action: () => { moveElementLayer(elementId, 'top'); onClose(); },
    },
    {
      label: '置于底层',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
        </svg>
      ),
      action: () => { moveElementLayer(elementId, 'bottom'); onClose(); },
    },
    { type: 'divider' },
    {
      label: '水平居中',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16M12 4v16" />
        </svg>
      ),
      action: () => { alignElement(elementId, 'horizontal-center'); onClose(); },
    },
    {
      label: '垂直居中',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16M4 12h16" />
        </svg>
      ),
      action: () => { alignElement(elementId, 'vertical-center'); onClose(); },
    },
    { type: 'divider' },
    {
      label: '删除',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      action: () => { deleteElement(elementId); onClose(); },
      danger: true,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {menuItems.map((item, index) =>
        item.type === 'divider' ? (
          <div key={index} className="h-px bg-gray-200 my-1" />
        ) : (
          <button
            key={index}
            onClick={item.action}
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition ${
              item.danger
                ? 'text-red-600 hover:bg-red-50'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
