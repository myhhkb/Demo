import { useState, useRef } from 'react';
import { useEditorStore } from '../../store';
import { api } from '../../api';

const recommendedColors = [
  '#ffffff', '#ff0000', '#ff00ff', '#cc00ff', '#9900cc', '#6633cc', '#336633', '#003333', '#333333', '#666666',
  '#999999', '#000000', '#808080', '#00cc00', '#00ffff', '#009999', '#6600cc', '#330066', '#000066', '#333300',
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
  const [bgMode, setBgMode] = useState<'color' | 'image'>('color');
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const aspectRatio = canvasWidth / canvasHeight;

  const handleWidthChange = (value: string) => {
    setTempWidth(value);
    if (isLockRatio) {
      const w = parseInt(value);
      if (!isNaN(w) && w > 0) {
        setTempHeight(Math.round(w / aspectRatio).toString());
      }
    }
  };

  const handleHeightChange = (value: string) => {
    setTempHeight(value);
    if (isLockRatio) {
      const h = parseInt(value);
      if (!isNaN(h) && h > 0) {
        setTempWidth(Math.round(h * aspectRatio).toString());
      }
    }
  };

  const handleSizeChange = () => {
    const w = Math.max(100, Math.min(2000, parseInt(tempWidth) || 600));
    const h = Math.max(100, Math.min(2000, parseInt(tempHeight) || 800));
    setTempWidth(w.toString());
    setTempHeight(h.toString());
    setCanvasSize(w, h);
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
      <h3 className="text-[15px] font-bold text-gray-900">画布</h3>

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] text-gray-600">画布尺寸</span>
          <button
            onClick={() => setLockRatio(!isLockRatio)}
            className="text-[12px] text-blue-500 hover:text-blue-600 transition"
          >
            {isLockRatio ? '解锁调整' : '关闭调整'}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex-1 flex items-center gap-1">
            <input
              type="number"
              value={tempWidth}
              onChange={(e) => handleWidthChange(e.target.value)}
              onBlur={handleSizeChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSizeChange()}
              className="w-full h-8 px-2 bg-gray-50 border border-gray-200 rounded-md text-[13px] text-center focus:bg-white focus:border-blue-400 outline-none transition"
            />
            <span className="text-[11px] text-gray-400 shrink-0">宽</span>
          </div>
          <button
            onClick={() => setLockRatio(!isLockRatio)}
            className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition ${
              isLockRatio ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-400'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </button>
          <div className="flex-1 flex items-center gap-1">
            <input
              type="number"
              value={tempHeight}
              onChange={(e) => handleHeightChange(e.target.value)}
              onBlur={handleSizeChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSizeChange()}
              className="w-full h-8 px-2 bg-gray-50 border border-gray-200 rounded-md text-[13px] text-center focus:bg-white focus:border-blue-400 outline-none transition"
            />
            <span className="text-[11px] text-gray-400 shrink-0">高</span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] text-gray-600">画布背景</span>
          <button
            onClick={resetBackground}
            className="text-[12px] text-blue-500 hover:text-blue-600 transition"
          >
            重置背景
          </button>
        </div>
        <div className="flex h-9 rounded-md overflow-hidden border border-gray-200 bg-gray-50">
          <button
            onClick={() => setBgMode('color')}
            className={`flex-1 text-[13px] text-center transition-all ${
              bgMode === 'color'
                ? 'bg-white text-gray-900 font-medium shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            纯色
          </button>
          <button
            onClick={() => setBgMode('image')}
            className={`flex-1 text-[13px] text-center transition-all border-l border-gray-200 ${
              bgMode === 'image'
                ? 'bg-white text-gray-900 font-medium shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            贴图
          </button>
        </div>
      </div>

      {bgMode === 'color' ? (
        <>
          <div>
            <span className="text-[13px] text-gray-600 mb-2.5 block">当前背景色</span>
            <div
              className="flex items-center h-8 rounded-lg border border-gray-200 px-2.5 py-1.5 cursor-pointer hover:border-gray-300 transition"
              onClick={() => colorInputRef.current?.click()}
            >
              <div
                className="flex-1 h-full rounded-[2px] border border-dashed border-gray-300"
                style={{ backgroundColor }}
              />
              <div className="shrink-0 w-7 h-full flex items-center justify-center ml-2">
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="1.5"/>
                  <circle cx="9" cy="8" r="1.5" fill="#ef4444"/>
                  <circle cx="14" cy="7.5" r="1.5" fill="#3b82f6"/>
                  <circle cx="16.5" cy="11" r="1.5" fill="#eab308"/>
                  <circle cx="8" cy="12.5" r="1.5" fill="#22c55e"/>
                  <path d="M14 16c1.5 0 3-1 3-2.5S16 11 14.5 11 12 12 12 13.5 12.5 16 14 16z" fill="#9ca3af"/>
                </svg>
              </div>
              <input
                ref={colorInputRef}
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
              />
            </div>
          </div>

          <div>
            <span className="text-[13px] text-gray-600 mb-2.5 block">推荐颜色</span>
            <div className="grid grid-cols-10 gap-[6px]">
              {recommendedColors.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => setBackgroundColor(color)}
                  className={`w-[22px] h-[22px] rounded-[4px] transition-transform hover:scale-125 ${
                    backgroundColor === color
                      ? 'ring-[2px] ring-blue-500 ring-offset-1'
                      : color === '#ffffff'
                        ? 'border border-gray-200'
                        : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {backgroundImage && (
            <div className="rounded-md overflow-hidden border border-gray-200">
              <img src={backgroundImage} alt="背景" className="w-full h-28 object-cover" />
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadLoading}
            className="w-full h-24 border border-dashed border-gray-300 rounded-md text-[13px] text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition disabled:opacity-50 flex flex-col items-center justify-center gap-1.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {uploadLoading ? '上传中...' : '点击上传背景图片'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadBackground}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
