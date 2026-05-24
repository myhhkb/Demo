import { useEditorStore } from '../../store';
import { TextElement } from '../../types';

interface Props {
  element: TextElement;
}

const fontFamilies = [
  'Microsoft YaHei',
  'SimSun',
  'SimHei',
  'KaiTi',
  'FangSong',
  'Arial',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
];

export default function TextProperties({ element }: Props) {
  const { updateElement } = useEditorStore();

  const update = (updates: Partial<TextElement>) => {
    updateElement(element.id, updates);
  };

  return (
    <div className="space-y-5">
      <h3 className="font-medium text-gray-800">文本属性</h3>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">字体</h4>
        <select
          value={element.fontFamily}
          onChange={(e) => update({ fontFamily: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          {fontFamilies.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">字号</h4>
        <input
          type="number"
          value={element.fontSize}
          onChange={(e) => update({ fontSize: Number(e.target.value) || 12 })}
          min={8}
          max={200}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">文字颜色</h4>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={element.color}
            onChange={(e) => update({ color: e.target.value })}
            className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={element.color}
            onChange={(e) => update({ color: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">样式</h4>
        <div className="flex gap-1">
          <button
            onClick={() => update({ fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold' })}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
              element.fontWeight === 'bold' ? 'bg-blue-100 text-blue-600 border border-blue-300' : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            B
          </button>
          <button
            onClick={() => update({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' })}
            className={`flex-1 py-2 rounded-lg text-sm italic transition ${
              element.fontStyle === 'italic' ? 'bg-blue-100 text-blue-600 border border-blue-300' : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            I
          </button>
          <button
            onClick={() => update({ textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline' })}
            className={`flex-1 py-2 rounded-lg text-sm underline transition ${
              element.textDecoration === 'underline' ? 'bg-blue-100 text-blue-600 border border-blue-300' : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            U
          </button>
          <button
            onClick={() => update({ textDecoration: element.textDecoration === 'line-through' ? 'none' : 'line-through' })}
            className={`flex-1 py-2 rounded-lg text-sm line-through transition ${
              element.textDecoration === 'line-through' ? 'bg-blue-100 text-blue-600 border border-blue-300' : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            S
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">对齐方式</h4>
        <div className="flex gap-1">
          {(['left', 'center', 'right', 'justify'] as const).map((align) => (
            <button
              key={align}
              onClick={() => update({ textAlign: align })}
              className={`flex-1 py-2 rounded-lg transition ${
                element.textAlign === align ? 'bg-blue-100 text-blue-600 border border-blue-300' : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {align === 'left' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />}
                {align === 'center' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />}
                {align === 'right' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />}
                {align === 'justify' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">字间距</h4>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={-5}
            max={20}
            step={0.5}
            value={element.letterSpacing}
            onChange={(e) => update({ letterSpacing: Number(e.target.value) })}
            className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <input
            type="number"
            value={element.letterSpacing}
            onChange={(e) => update({ letterSpacing: Number(e.target.value) })}
            className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">行间距</h4>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0.8}
            max={3}
            step={0.1}
            value={element.lineHeight}
            onChange={(e) => update({ lineHeight: Number(e.target.value) })}
            className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <input
            type="number"
            value={element.lineHeight}
            onChange={(e) => update({ lineHeight: Number(e.target.value) })}
            step={0.1}
            className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">透明度</h4>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={element.opacity}
            onChange={(e) => update({ opacity: Number(e.target.value) })}
            className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-sm text-gray-600 w-12 text-right">{Math.round(element.opacity * 100)}%</span>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">阴影效果</h4>
          <button
            onClick={() => update({ shadow: !element.shadow })}
            className={`relative w-10 h-5 rounded-full transition ${element.shadow ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition ${element.shadow ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
          </button>
        </div>
        {element.shadow && (
          <div className="space-y-2 pl-2 border-l-2 border-blue-200">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 w-16">颜色</label>
              <input
                type="color"
                value={element.shadowColor.startsWith('rgba') ? '#000000' : element.shadowColor}
                onChange={(e) => update({ shadowColor: e.target.value })}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 w-16">模糊</label>
              <input
                type="range"
                min={0}
                max={20}
                value={element.shadowBlur}
                onChange={(e) => update({ shadowBlur: Number(e.target.value) })}
                className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-xs text-gray-500 w-8">{element.shadowBlur}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 w-16">X偏移</label>
              <input
                type="range"
                min={-20}
                max={20}
                value={element.shadowOffsetX}
                onChange={(e) => update({ shadowOffsetX: Number(e.target.value) })}
                className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-xs text-gray-500 w-8">{element.shadowOffsetX}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 w-16">Y偏移</label>
              <input
                type="range"
                min={-20}
                max={20}
                value={element.shadowOffsetY}
                onChange={(e) => update({ shadowOffsetY: Number(e.target.value) })}
                className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-xs text-gray-500 w-8">{element.shadowOffsetY}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
