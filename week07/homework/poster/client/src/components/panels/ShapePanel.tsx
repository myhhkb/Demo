import { useState } from 'react';
import { useEditorStore } from '../../store';

type ShapeCategory = 'basic' | 'festival' | 'other';

const shapes: Record<ShapeCategory, { name: string; svg: string }[]> = {
  basic: [
    { name: '矩形', svg: '<rect x="10" y="10" width="80" height="80" />' },
    { name: '圆形', svg: '<circle cx="50" cy="50" r="40" />' },
    { name: '三角形', svg: '<polygon points="50,10 90,90 10,90" />' },
    { name: '菱形', svg: '<polygon points="50,5 95,50 50,95 5,50" />' },
    { name: '五角星', svg: '<polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" />' },
    { name: '六边形', svg: '<polygon points="50,5 90,25 90,75 50,95 10,75 10,25" />' },
    { name: '圆角矩形', svg: '<rect x="10" y="10" width="80" height="80" rx="15" ry="15" />' },
    { name: '椭圆', svg: '<ellipse cx="50" cy="50" rx="45" ry="30" />' },
    { name: '平行四边形', svg: '<polygon points="25,10 95,10 75,90 5,90" />' },
    { name: '梯形', svg: '<polygon points="30,10 70,10 90,90 10,90" />' },
    { name: '箭头右', svg: '<polygon points="10,30 60,30 60,10 95,50 60,90 60,70 10,70" />' },
    { name: '十字', svg: '<polygon points="35,10 65,10 65,35 90,35 90,65 65,65 65,90 35,90 35,65 10,65 10,35 35,35" />' },
  ],
  festival: [
    { name: '爱心', svg: '<path d="M50,88 C25,70 5,55 5,35 C5,20 15,10 30,10 C40,10 48,16 50,20 C52,16 60,10 70,10 C85,10 95,20 95,35 C95,55 75,70 50,88Z" />' },
    { name: '月亮', svg: '<path d="M50,10 C30,10 15,25 15,50 C15,75 30,90 50,90 C35,80 30,65 30,50 C30,35 35,20 50,10Z" />' },
    { name: '云朵', svg: '<path d="M25,65 C10,65 10,50 20,45 C15,35 25,25 35,30 C40,20 55,20 60,30 C70,25 85,30 80,45 C90,50 90,65 75,65Z" />' },
    { name: '闪电', svg: '<polygon points="55,5 25,50 45,50 35,95 75,45 55,45 65,5" />' },
    { name: '对话框', svg: '<path d="M15,15 h70 a5,5 0 0,1 5,5 v40 a5,5 0 0,1 -5,5 h-40 l-15,15 v-15 h-10 a5,5 0 0,1 -5,-5 v-40 a5,5 0 0,1 5,-5z" />' },
    { name: '礼物', svg: '<rect x="15" y="40" width="70" height="50" rx="3"/><rect x="15" y="30" width="70" height="15" rx="3"/><rect x="45" y="30" width="10" height="60"/><path d="M50,30 C50,30 35,15 25,20 C20,25 25,35 50,30Z"/><path d="M50,30 C50,30 65,15 75,20 C80,25 75,35 50,30Z"/>' },
  ],
  other: [
    { name: '波浪', svg: '<path d="M5,50 Q25,30 50,50 Q75,70 95,50 L95,90 L5,90 Z" />' },
    { name: '圆环', svg: '<circle cx="50" cy="50" r="40" fill="none" stroke-width="10"/>' },
    { name: '半圆', svg: '<path d="M10,60 A40,40 0 0,1 90,60 Z" />' },
    { name: '扇形', svg: '<path d="M50,50 L90,50 A40,40 0 0,1 50,90 Z" />' },
    { name: '八角形', svg: '<polygon points="35,5 65,5 95,35 95,65 65,95 35,95 5,65 5,35" />' },
    { name: '标签', svg: '<path d="M10,15 h55 l25,35 l-25,35 h-55 z" />' },
  ],
};

const categoryLabels: Record<ShapeCategory, string> = {
  basic: '基础',
  festival: '节日',
  other: '其它',
};

export default function ShapePanel() {
  const [category, setCategory] = useState<ShapeCategory>('basic');
  const { addShapeElement, canvasWidth, canvasHeight } = useEditorStore();

  const handleAddShape = (svg: string) => {
    const x = (canvasWidth - 120) / 2;
    const y = (canvasHeight - 120) / 2;
    addShapeElement(svg, x, y);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-800">形状</h3>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {(Object.keys(shapes) as ShapeCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-1 py-1.5 text-xs rounded-md transition ${
              category === cat
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {shapes[category].map((shape, index) => (
          <button
            key={index}
            onClick={() => handleAddShape(shape.svg)}
            className="aspect-square p-2 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 border border-gray-200 rounded-lg transition flex items-center justify-center group"
            title={shape.name}
          >
            <svg
              viewBox="0 0 100 100"
              className="w-8 h-8 text-gray-600 group-hover:text-blue-500 transition"
              fill="currentColor"
            >
              <g dangerouslySetInnerHTML={{ __html: shape.svg }} />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
