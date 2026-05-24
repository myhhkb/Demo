import { useEditorStore } from '../../store';
import { ImageElement } from '../../types';

interface Props {
  element: ImageElement;
}

export default function ImageProperties({ element }: Props) {
  const { updateElement } = useEditorStore();

  const update = (updates: Partial<ImageElement>) => {
    updateElement(element.id, updates);
  };

  return (
    <div className="space-y-5">
      <h3 className="font-medium text-gray-800">图片属性</h3>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">预览</h4>
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <img src={element.src} alt="" className="w-full h-32 object-contain bg-gray-50" />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">填充方式</h4>
        <div className="flex gap-1">
          {(['cover', 'contain', 'fill'] as const).map((fit) => (
            <button
              key={fit}
              onClick={() => update({ objectFit: fit })}
              className={`flex-1 py-2 rounded-lg text-xs transition ${
                element.objectFit === fit
                  ? 'bg-blue-100 text-blue-600 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {fit === 'cover' ? '裁剪填充' : fit === 'contain' ? '完整显示' : '拉伸填充'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">圆角</h4>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            value={element.borderRadius}
            onChange={(e) => update({ borderRadius: Number(e.target.value) })}
            className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <input
            type="number"
            value={element.borderRadius}
            onChange={(e) => update({ borderRadius: Number(e.target.value) })}
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

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">尺寸</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">宽度</label>
            <input
              type="number"
              value={Math.round(element.width)}
              onChange={(e) => update({ width: Number(e.target.value) || 20 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">高度</label>
            <input
              type="number"
              value={Math.round(element.height)}
              onChange={(e) => update({ height: Number(e.target.value) || 20 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">旋转角度</h4>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={-180}
            max={180}
            value={element.rotation}
            onChange={(e) => update({ rotation: Number(e.target.value) })}
            className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <input
            type="number"
            value={element.rotation}
            onChange={(e) => update({ rotation: Number(e.target.value) })}
            className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <span className="text-xs text-gray-500">°</span>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">阴影效果</h4>
          <button
            onClick={() => update({ shadow: !element.shadow })}
            className={`relative w-10 h-5 rounded-full transition ${element.shadow ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition ${element.shadow ? 'left-[22px]' : 'left-0.5'}`} />
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
