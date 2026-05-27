import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [posterId, setPosterId] = useState<number | undefined>(undefined);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { canvasWidth, canvasHeight, backgroundColor, backgroundImage, elements } = useEditorStore();

  // Load poster data on mount
  useEffect(() => {
    api.getPosters().then((res) => {
      if (res.posters && res.posters.length > 0) {
        const latest = res.posters[0];
        setPosterId(latest.id);
        if (latest.data) {
          try {
            const state = JSON.parse(latest.data);
            useEditorStore.getState().loadState(state);
          } catch (e) {}
        }
      }
    }).catch(() => {});
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const state = useEditorStore.getState().getCanvasState();
      api.savePosters({
        title: '我的海报',
        width: state.width,
        height: state.height,
        data: JSON.stringify(state),
      }, posterId).then((res) => {
        if (res.poster && !posterId) {
          setPosterId(res.poster.id);
        }
      }).catch(() => {});
    }, 2000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [canvasWidth, canvasHeight, backgroundColor, backgroundImage, elements, posterId]);

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
        <div className="flex-1 relative">
          <div className="absolute inset-0 overflow-auto canvas-container">
            <Canvas />
          </div>
          <ZoomControls />
        </div>
        <RightPanel />
      </div>
    </div>
  );
}
