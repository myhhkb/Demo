import { useRef } from 'react';
import { useEditorStore } from '../../store';
import { TextElement } from '../../types';

interface Props {
  element: TextElement;
}

const fontFamilyMap: Record<string, string> = {
  'Microsoft YaHei': '微软雅黑',
  'SimSun': '宋体',
  'SimHei': '黑体',
  'KaiTi': '楷体',
  'FangSong': '仿宋',
  'Arial': 'Arial',
  'Times New Roman': 'Times',
  'Georgia': 'Georgia',
};

export default function TextProperties({ element }: Props) {
  const { updateElement, alignElement, canvasWidth, canvasHeight } = useEditorStore();
  const colorRef = useRef<HTMLInputElement>(null);
  const shadowColorRef = useRef<HTMLInputElement>(null);

  const update = (updates: Partial<TextElement>) => {
    updateElement(element.id, updates);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-[16px] font-bold text-gray-900 pb-1 border-b border-gray-200">文本</h3>
      <span className="text-[14px] font-bold text-gray-900 block">文字样式</span>

      <div className="space-y-4">
        <div className="flex items-center">
          <span className="text-[13px] text-gray-600 w-12 shrink-0">字体</span>
          <div className="flex-1 flex items-center gap-1.5">
            <select
              value={element.fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value })}
              className="flex-1 h-8 px-2 border border-gray-200 rounded text-[13px] focus:border-blue-400 outline-none cursor-pointer bg-white"
            >
              {Object.entries(fontFamilyMap).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <div className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-[14px] font-serif text-gray-600">T</div>
          </div>
        </div>

        <div className="flex items-center">
          <span className="text-[13px] text-gray-600 w-12 shrink-0">字号</span>
          <div className="flex-1 flex items-center gap-1.5">
            <input type="number" value={element.fontSize} onChange={(e) => update({ fontSize: Number(e.target.value) || 12 })} min={8} max={200} className="w-16 h-8 px-2 border border-gray-200 rounded text-[13px] text-center focus:border-blue-400 outline-none" />
            <div className="flex-1 flex items-center gap-1.5">
              <div className="flex-1 h-8 rounded border border-dashed border-gray-300 cursor-pointer" style={{ backgroundColor: element.color }} onClick={() => colorRef.current?.click()} />
              <button onClick={() => colorRef.current?.click()} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50">
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="1.5"/><circle cx="9" cy="8" r="1.5" fill="#ef4444"/><circle cx="14" cy="7.5" r="1.5" fill="#3b82f6"/><circle cx="16.5" cy="11" r="1.5" fill="#eab308"/><circle cx="8" cy="12.5" r="1.5" fill="#22c55e"/><path d="M14 16c1.5 0 3-1 3-2.5S16 11 14.5 11 12 12 12 13.5 12.5 16 14 16z" fill="#9ca3af"/></svg>
              </button>
            </div>
            <input ref={colorRef} type="color" value={element.color} onChange={(e) => update({ color: e.target.value })} className="absolute opacity-0 w-0 h-0 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center">
          <span className="text-[13px] text-gray-600 w-12 shrink-0">样式</span>
          <div className="flex-1 flex gap-1.5">
            <button onClick={() => update({ fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold' })} className={'w-9 h-8 flex items-center justify-center rounded border text-[13px] font-bold transition ' + (element.fontWeight === 'bold' ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>B</button>
            <button onClick={() => update({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' })} className={'w-9 h-8 flex items-center justify-center rounded border text-[13px] italic transition ' + (element.fontStyle === 'italic' ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>I</button>
            <button onClick={() => update({ textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline' })} className={'w-9 h-8 flex items-center justify-center rounded border text-[13px] underline transition ' + (element.textDecoration === 'underline' ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>U</button>
            <button onClick={() => update({ textDecoration: element.textDecoration === 'line-through' ? 'none' : 'line-through' })} className={'w-9 h-8 flex items-center justify-center rounded border text-[13px] line-through transition ' + (element.textDecoration === 'line-through' ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>S</button>
          </div>
        </div>

        <div className="flex items-center">
          <span className="text-[13px] text-gray-600 w-12 shrink-0">对齐</span>
          <div className="flex-1 flex gap-1.5">
            <button onClick={() => update({ textAlign: 'left' })} className={'w-12 h-8 flex items-center justify-center rounded border transition ' + (element.textAlign === 'left' ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M3 6h18M3 12h10M3 18h14"/></svg></button>
            <button onClick={() => update({ textAlign: 'center' })} className={'w-12 h-8 flex items-center justify-center rounded border transition ' + (element.textAlign === 'center' ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M3 6h18M7 12h10M5 18h14"/></svg></button>
            <button onClick={() => update({ textAlign: 'right' })} className={'w-12 h-8 flex items-center justify-center rounded border transition ' + (element.textAlign === 'right' ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M3 6h18M11 12h10M7 18h14"/></svg></button>
          </div>
        </div>

        <div className="flex items-center">
          <span className="text-[13px] text-gray-600 w-12 shrink-0">字间距</span>
          <div className="flex-1 flex items-center gap-2">
            <input type="range" min={-5} max={20} step={0.5} value={element.letterSpacing} onChange={(e) => update({ letterSpacing: Number(e.target.value) })} className="flex-1 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500" />
            <input type="number" value={element.letterSpacing} onChange={(e) => update({ letterSpacing: Number(e.target.value) })} className="w-14 h-7 px-1 border border-gray-200 rounded text-[12px] text-center focus:border-blue-400 outline-none" />
          </div>
        </div>

        <div className="flex items-center">
          <span className="text-[13px] text-gray-600 w-12 shrink-0">行间距</span>
          <div className="flex-1 flex items-center gap-2">
            <input type="range" min={0.8} max={3} step={0.1} value={element.lineHeight} onChange={(e) => update({ lineHeight: Number(e.target.value) })} className="flex-1 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500" />
            <input type="number" value={element.lineHeight} onChange={(e) => update({ lineHeight: Number(e.target.value) })} step={0.1} className="w-14 h-7 px-1 border border-gray-200 rounded text-[12px] text-center focus:border-blue-400 outline-none" />
          </div>
        </div>

        <div className="flex items-center">
          <span className="text-[13px] text-gray-600 w-12 shrink-0">透明度</span>
          <div className="flex-1 flex items-center gap-2">
            <input type="range" min={0} max={100} value={Math.round(element.opacity*100)} onChange={(e) => update({ opacity: Number(e.target.value)/100 })} className="flex-1 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500" />
            <input type="number" value={Math.round(element.opacity*100)} onChange={(e) => update({ opacity: Math.min(100,Math.max(0,Number(e.target.value)))/100 })} className="w-14 h-7 px-1 border border-gray-200 rounded text-[12px] text-center focus:border-blue-400 outline-none" />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-bold text-gray-900">阴影</span>
          <button onClick={() => update({ shadow: !element.shadow })} className={'relative w-11 h-6 rounded-full transition-colors ' + (element.shadow ? 'bg-blue-500' : 'bg-gray-300')}>
            <span className={'absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ' + (element.shadow ? 'left-6' : 'left-1')} />
          </button>
        </div>
        {element.shadow && (
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-[13px] text-gray-600 w-12 shrink-0">颜色</span>
              <div className="flex-1 flex items-center gap-1.5">
                <div className="flex-1 h-8 rounded border border-dashed border-gray-300 cursor-pointer" style={{ backgroundColor: element.shadowColor.startsWith('rgba') ? '#000000' : element.shadowColor }} onClick={() => shadowColorRef.current?.click()} />
                <button onClick={() => shadowColorRef.current?.click()} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50">
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="1.5"/><circle cx="9" cy="8" r="1.5" fill="#ef4444"/><circle cx="14" cy="7.5" r="1.5" fill="#3b82f6"/><circle cx="16.5" cy="11" r="1.5" fill="#eab308"/><circle cx="8" cy="12.5" r="1.5" fill="#22c55e"/><path d="M14 16c1.5 0 3-1 3-2.5S16 11 14.5 11 12 12 12 13.5 12.5 16 14 16z" fill="#9ca3af"/></svg>
                </button>
                <input ref={shadowColorRef} type="color" value={element.shadowColor.startsWith('rgba') ? '#000000' : element.shadowColor} onChange={(e) => update({ shadowColor: e.target.value })} className="absolute opacity-0 w-0 h-0 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-[13px] text-gray-600 w-12 shrink-0">水平</span>
              <div className="flex-1 flex items-center gap-2">
                <input type="range" min={-20} max={20} value={element.shadowOffsetX} onChange={(e) => update({ shadowOffsetX: Number(e.target.value) })} className="flex-1 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500" />
                <input type="number" value={element.shadowOffsetX} onChange={(e) => update({ shadowOffsetX: Number(e.target.value) })} className="w-14 h-7 px-1 border border-gray-200 rounded text-[12px] text-center focus:border-blue-400 outline-none" />
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-[13px] text-gray-600 w-12 shrink-0">垂直</span>
              <div className="flex-1 flex items-center gap-2">
                <input type="range" min={-20} max={20} value={element.shadowOffsetY} onChange={(e) => update({ shadowOffsetY: Number(e.target.value) })} className="flex-1 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500" />
                <input type="number" value={element.shadowOffsetY} onChange={(e) => update({ shadowOffsetY: Number(e.target.value) })} className="w-14 h-7 px-1 border border-gray-200 rounded text-[12px] text-center focus:border-blue-400 outline-none" />
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-[13px] text-gray-600 w-12 shrink-0">模糊</span>
              <div className="flex-1 flex items-center gap-2">
                <input type="range" min={0} max={20} value={element.shadowBlur} onChange={(e) => update({ shadowBlur: Number(e.target.value) })} className="flex-1 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500" />
                <input type="number" value={element.shadowBlur} onChange={(e) => update({ shadowBlur: Number(e.target.value) })} className="w-14 h-7 px-1 border border-gray-200 rounded text-[12px] text-center focus:border-blue-400 outline-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4 border-t border-gray-200">
        <span className="text-[14px] font-bold text-gray-900 block">排版</span>
        <div className="flex gap-1.5">
          <button onClick={() => alignElement(element.id, 'horizontal-center')} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-600 hover:bg-gray-50" title="水平居中"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 3v18M6 8h12M8 16h8"/></svg></button>
          <button onClick={() => alignElement(element.id, 'vertical-center')} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-600 hover:bg-gray-50" title="垂直居中"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M3 12h18M8 6v12M16 8v8"/></svg></button>
          <button onClick={() => updateElement(element.id, { x: 0 })} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-600 hover:bg-gray-50" title="左对齐"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M4 3v18M8 8h12M8 12h8M8 16h10"/></svg></button>
          <button onClick={() => updateElement(element.id, { x: canvasWidth - element.width })} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-600 hover:bg-gray-50" title="右对齐"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M20 3v18M4 8h12M8 12h8M6 16h10"/></svg></button>
          <button onClick={() => updateElement(element.id, { y: 0 })} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-600 hover:bg-gray-50" title="顶部对齐"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M3 4h18M8 8v12M16 8v8"/></svg></button>
          <button onClick={() => updateElement(element.id, { x: (canvasWidth - element.width) / 2, y: (canvasHeight - element.height) / 2 })} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-600 hover:bg-gray-50" title="居中"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 3v18M7 7h10M9 12h6M7 17h10"/></svg></button>
          <button onClick={() => updateElement(element.id, { y: canvasHeight - element.height })} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-600 hover:bg-gray-50" title="底部对齐"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M3 20h18M8 4v12M16 8v8"/></svg></button>
        </div>
      </div>
    </div>
  );
}
