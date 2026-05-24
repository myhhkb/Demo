import { useCallback } from 'react';
import { api } from '../api';
import { useEditorStore } from '../store';
import Toolbar from '../components/Toolbar';
import LeftPanel from '../components/LeftPanel';
import Canvas from '../components/Canvas';
import RightPanel from '../components/RightPanel';
import ZoomControls from '../components/ZoomControls';

interface EditorProps {
  user: { id: number; username: string };
  onLogout: () => void;
}

export default function Editor({ user, onLogout }: EditorProps) {
  const handleLogout = useCallback(async () => {
    try {
      await api.logout();
      onLogout();
    } catch (err) {
      console.error(err);
    }
  }, [onLogout]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-100">
      <Toolbar user={user} onLogout={handleLogout} />
      <div className="flex-1 flex overflow-hidden">
        <LeftPanel />
        <div className="flex-1 relative flex flex-col">
          <div className="flex-1 overflow-auto flex items-center justify-center canvas-container">
            <Canvas />
          </div>
          <ZoomControls />
        </div>
        <RightPanel />
      </div>
    </div>
  );
}
