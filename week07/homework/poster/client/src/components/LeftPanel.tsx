import { useState } from 'react';
import { useEditorStore } from '../store';
import TextPanel from './panels/TextPanel';
import ShapePanel from './panels/ShapePanel';
import ImagePanel from './panels/ImagePanel';

type TabType = 'text' | 'shape' | 'image';

const tabs: { key: TabType; label: string; icon: JSX.Element }[] = [
  {
    key: 'text',
    label: '文本',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
      </svg>
    ),
  },
  {
    key: 'shape',
    label: '形状',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
      </svg>
    ),
  },
  {
    key: 'image',
    label: '图片',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function LeftPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('text');

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-shrink-0">
      <div className="w-16 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 transition ${
              activeTab === tab.key
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            <span className="text-[10px]">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'text' && <TextPanel />}
        {activeTab === 'shape' && <ShapePanel />}
        {activeTab === 'image' && <ImagePanel />}
      </div>
    </div>
  );
}
