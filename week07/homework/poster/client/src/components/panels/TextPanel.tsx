import { useEditorStore } from '../../store';

export default function TextPanel() {
  const { setTool, tool } = useEditorStore();

  const isDrawingMode = tool === 'text';

  const handleToggleDrawMode = () => {
    if (isDrawingMode) {
      setTool(null);
    } else {
      setTool('text');
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleToggleDrawMode}
        className={`w-full py-2.5 rounded-md text-sm font-medium transition flex items-center justify-center gap-1 ${
          isDrawingMode
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        {isDrawingMode ? '取消绘制' : '添加文本'}
      </button>
      {isDrawingMode && (
        <div className="text-[12px] text-center text-blue-500 py-2 bg-blue-50 rounded-md border border-blue-200">
          在画布上单击或拖拽进行绘制
        </div>
      )}
    </div>
  );
}
