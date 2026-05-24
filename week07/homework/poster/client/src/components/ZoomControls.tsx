import { useEditorStore } from '../store';

export default function ZoomControls() {
  const { zoom, setZoom } = useEditorStore();

  return (
    <div className="h-10 bg-white border-t border-gray-100 flex items-center justify-center gap-2">
      <button
        onClick={() => setZoom(zoom - 10)}
        disabled={zoom <= 10}
        className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition text-lg leading-none"
      >
        −
      </button>
      <span className="text-[13px] text-gray-600 w-12 text-center select-none">{zoom} %</span>
      <button
        onClick={() => setZoom(zoom + 10)}
        disabled={zoom >= 200}
        className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition text-lg leading-none"
      >
        +
      </button>
    </div>
  );
}
