import { useEditorStore } from '../../store';

export default function TextPanel() {
  const { setTool, tool, addTextElement, canvasWidth, canvasHeight } = useEditorStore();

  const handleQuickAddText = () => {
    const x = (canvasWidth - 200) / 2;
    const y = (canvasHeight - 40) / 2;
    addTextElement(x, y);
  };

  return (
    <div>
      <button
        onClick={handleQuickAddText}
        className="w-full py-2.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-1"
      >
        添加文本
      </button>
    </div>
  );
}
