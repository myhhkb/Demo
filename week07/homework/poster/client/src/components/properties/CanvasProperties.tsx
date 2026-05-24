import { useState, useRef } from 'react';
import { useEditorStore } from '../../store';
import { api } from '../../api';

const recommendedColors = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#000000',
  '#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d',
  '#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12',
  '#fefce8', '#fef9c3', '#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12',
  '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d',
  '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a',
  '#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87',
  '#fdf2f8', '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843',
];

export default function CanvasProperties() {
  const {
    canvasWidth,
    canvasHeight,
    backgroundColor,
    backgroundImage,
    isLockRatio,
    setCanvasSize,
    setBackgroundColor,
    setBackgroundImage,
    resetBackground,
    setLockRatio,
  } = useEditorStore();

  const [tempWidth, setTempWidth] = useState(canvasWidth.toString());
  const [tempHeight, setTempHeight] = useState(canvasHeight.toString());
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSizeChange = () => {
    const w = parseInt(tempWidth) || 600;
    const h = parseInt(tempHeight) || 800;
    setCanvasSize(Math.max(100, Math.min(2000, w)), Math.max(100, Math.min(2000, h)));
  };

  const handleUploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const res = await api.uploadFile(file);
      setBackgroundImage(res.url);
    } catch (err: any) {
      alert(err.message || '上传失败');
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-gray-800 mb-4">画布属性</h3>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">画布尺寸</h4>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">宽度</label>
            <input
              type="number"
              value={tempWidth}
              onChange={(e) => setTempWidth(e.target.value)}
              onBlur={handleSizeChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSizeChange()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <button
            onClick={() => setLockRatio(!isLockRatio)}
            className={`mt-5 p-2 rounded-lg transition ${isLockRatio ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
            title={isLockRatio ? '解锁宽高比' : '锁定宽高比'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isLockRatio ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              )}
            </svg>
          </button>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">高度</label>
            <input
              type="number"
              value={tempHeight}
              onChange={(e) => setTempHeight(e.target.value)}
              onBlur={handleSizeChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSizeChange()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700">背景颜色</h4>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="grid grid-cols-10 gap-1">
          {recommendedColors.map((color) => (
            <button
              key={color}
              onClick={() => setBackgroundColor(color)}
              className={`w-5 h-5 rounded border transition hover:scale-110 ${
                backgroundColor === color ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700">背景图片</h4>
        {backgroundImage && (
          <div className="relative rounded-lg overflow-hidden border border-gray-200">
            <img src={backgroundImage} alt="背景" className="w-full h-24 object-cover" />
          </div>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadLoading}
          className="w-full py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
        >
          {uploadLoading ? '上传中...' : '上传背景图片'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUploadBackground}
          className="hidden"
        />
        <button
          onClick={resetBackground}
          className="w-full py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          重置背景
        </button>
      </div>
    </div>
  );
}
