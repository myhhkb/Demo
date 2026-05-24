import { useCallback, useRef } from 'react';
import { toPng } from 'html-to-image';
import { useEditorStore } from '../store';

interface ToolbarProps {
  user: { id: number; username: string };
  onLogout: () => void;
}

export default function Toolbar({ user, onLogout }: ToolbarProps) {
  const { undo, redo, canUndo, canRedo } = useEditorStore();

  const handleDownload = useCallback(async () => {
    const canvasEl = document.getElementById('poster-canvas');
    if (!canvasEl) return;

    try {
      const dataUrl = await toPng(canvasEl, {
        quality: 1,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `海报_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('导出失败:', err);
      alert('导出失败，请重试');
    }
  }, []);

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-800">海报设计器</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="撤销 (Ctrl+Z)"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="重做 (Ctrl+Y)"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          下载
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <span className="text-sm text-gray-600">{user.username}</span>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-gray-700"
            title="退出登录"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
