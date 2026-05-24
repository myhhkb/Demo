import { useCallback } from 'react';
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
    <div className="h-12 bg-white border-b border-gray-100 flex items-center justify-between px-4">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-[15px] font-semibold text-gray-800">在线海报设计</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="撤销"
        >
          <svg className="w-[18px] h-[18px] text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="重做"
        >
          <svg className="w-[18px] h-[18px] text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onLogout}
          className="text-[13px] text-gray-500 hover:text-gray-700 transition"
        >
          退出登录
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 h-8 px-4 bg-blue-500 hover:bg-blue-600 text-white text-[13px] font-medium rounded-md transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          下载
        </button>
      </div>
    </div>
  );
}
