import { useState, useRef } from 'react';
import { useEditorStore } from '../../store';
import { api } from '../../api';

const presetImages = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop',
];

export default function ImagePanel() {
  const { addImageElement, canvasWidth, canvasHeight } = useEditorStore();
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImage = (src: string) => {
    const x = (canvasWidth - 200) / 2;
    const y = (canvasHeight - 200) / 2;
    addImageElement(src, x, y);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const res = await api.uploadFile(file);
      handleAddImage(res.url);
    } catch (err: any) {
      alert(err.message || '上传失败');
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.generateImage(aiPrompt);
      handleAddImage(res.url);
      setAiPrompt('');
    } catch (err: any) {
      alert(err.message || 'AI生成失败');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-800">图片</h3>

      <div className="space-y-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadLoading}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {uploadLoading ? '上传中...' : '上传图片'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">AI 生图</h4>
        <div className="space-y-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="描述你想要的图片..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
          />
          <button
            onClick={handleAiGenerate}
            disabled={aiLoading || !aiPrompt.trim()}
            className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiLoading ? '生成中...' : 'AI 生成图片'}
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">预设图片</h4>
        <div className="grid grid-cols-2 gap-2">
          {presetImages.map((src, index) => (
            <div
              key={index}
              onClick={() => handleAddImage(src)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/poster-image', src);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition hover:shadow-md cursor-grab active:cursor-grabbing"
            >
              <img
                src={src}
                alt={`预设图片 ${index + 1}`}
                className="w-full h-full object-cover pointer-events-none"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
