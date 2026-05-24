import { useState } from 'react';
import TextPanel from './panels/TextPanel';
import ShapePanel from './panels/ShapePanel';
import ImagePanel from './panels/ImagePanel';

type TabType = 'text' | 'shape' | 'image';

const tabs: { key: TabType; label: string; icon: JSX.Element }[] = [
  {
    key: 'text',
    label: '文本',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    key: 'shape',
    label: '形状',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
      </svg>
    ),
  },
  {
    key: 'image',
    label: '图片',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function LeftPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('text');

  return (
    <div className="w-[240px] bg-white border-r border-gray-100 flex flex-shrink-0">
      <div className="w-[52px] bg-[#fafafa] border-r border-gray-100 flex flex-col items-center pt-3 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`w-10 h-11 rounded-md flex flex-col items-center justify-center gap-[2px] transition-all ${
              activeTab === tab.key
                ? 'bg-blue-500 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] leading-none">{tab.label}</span>
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
