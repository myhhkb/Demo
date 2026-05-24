import { useEditorStore } from '../../store';

export default function TextPanel() {
  const { setTool, tool, addTextElement, canvasWidth, canvasHeight } = useEditorStore();

  const handleAddText = () => {
    setTool('text');
  };

  const handleQuickAddText = () => {
    const x = (canvasWidth - 200) / 2;
    const y = (canvasHeight - 40) / 2;
    addTextElement(x, y);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-800">文本</h3>
      
      <button
        onClick={handleQuickAddText}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        添加文本
      </button>

      <div className="text-xs text-gray-500 mt-2">
        点击按钮在画布中央添加文本，或选择"文本"工具后在画布上点击/拖拽绘制文本框
      </div>

      <button
        onClick={handleAddText}
        className={`w-full py-2.5 rounded-lg transition flex items-center justify-center gap-2 ${
          tool === 'text'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        绘制文字
      </button>

      <div className="pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">预设样式</h4>
        <div className="space-y-2">
          {[
            { label: '大标题', fontSize: 48, fontWeight: 'bold' as const },
            { label: '小标题', fontSize: 32, fontWeight: 'bold' as const },
            { label: '正文', fontSize: 18, fontWeight: 'normal' as const },
            { label: '注释', fontSize: 14, fontWeight: 'normal' as const },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                const x = (canvasWidth - 200) / 2;
                const y = (canvasHeight - 40) / 2;
                addTextElement(x, y);
              }}
              className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition"
            >
              <span
                style={{
                  fontSize: Math.min(preset.fontSize, 24),
                  fontWeight: preset.fontWeight,
                }}
              >
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
