import { useEditorStore } from '../store';

export default function ZoomControls() {
  const { zoom, setZoom } = useEditorStore();

  return (
    <div className="h-12 bg-white border-t border-gray-200 flex items-center justify-center gap-3 px-4">
      <button
        onClick={() => setZoom(zoom - 10)}
        disabled={zoom <= 10}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>

      <div className="flex items-center gap-2">
        <input
          type="range"
          min="10"
          max="200"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-32 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <input
          type="number"
          min="10"
          max="200"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-14 px-2 py-1 text-sm text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <span className="text-sm text-gray-500">%</span>
      </div>

      <button
        onClick={() => setZoom(zoom + 10)}
        disabled={zoom >= 200}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <button
        onClick={() => setZoom(100)}
        className="ml-2 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition"
      >
        重置
      </button>
    </div>
  );
}
