import { useState } from 'react';
import { useEditorStore } from '../store';

export default function ZoomControls() {
  const { zoom, setZoom } = useEditorStore();
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(zoom.toString());

  const handleInputBlur = () => {
    setEditing(false);
    const val = parseInt(tempValue);
    if (!isNaN(val) && val >= 10 && val <= 200) {
      setZoom(val);
    } else {
      setTempValue(zoom.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setEditing(false);
      setTempValue(zoom.toString());
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-50 flex items-center gap-1 bg-white rounded-full shadow-md border border-gray-200 px-2 py-1">
      <button
        onClick={() => setZoom(zoom - 10)}
        disabled={zoom <= 10}
        className="w-7 h-7 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition text-[16px] font-medium"
      >
        −
      </button>
      {editing ? (
        <input
          type="number"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          autoFocus
          className="w-14 h-7 text-[13px] text-center text-gray-700 bg-gray-50 border border-gray-200 rounded outline-none focus:border-blue-400"
        />
      ) : (
        <button
          onClick={() => { setEditing(true); setTempValue(zoom.toString()); }}
          className="min-w-[52px] h-7 px-1 text-[13px] text-gray-600 hover:bg-gray-50 rounded transition text-center"
        >
          {zoom} %
        </button>
      )}
      <button
        onClick={() => setZoom(zoom + 10)}
        disabled={zoom >= 200}
        className="w-7 h-7 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition text-[16px] font-medium"
      >
        +
      </button>
    </div>
  );
}
