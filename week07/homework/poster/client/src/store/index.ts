import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { CanvasElement, CanvasState, TextElement, ShapeElement, ImageElement } from '../types';

interface EditorStore {
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  backgroundImage: string | null;
  elements: CanvasElement[];
  selectedElementId: string | null;
  zoom: number;
  isLockRatio: boolean;
  tool: 'select' | 'text' | null;

  past: CanvasState[];
  future: CanvasState[];

  setCanvasSize: (width: number, height: number) => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundImage: (url: string | null) => void;
  resetBackground: () => void;
  setZoom: (zoom: number) => void;
  setTool: (tool: 'select' | 'text' | null) => void;
  setLockRatio: (lock: boolean) => void;

  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  moveElementLayer: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  alignElement: (id: string, alignment: 'horizontal-center' | 'vertical-center') => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  saveSnapshot: () => void;
  loadState: (state: CanvasState) => void;
  getCanvasState: () => CanvasState;

  addTextElement: (x: number, y: number, width?: number, height?: number) => void;
  addShapeElement: (svgContent: string, x?: number, y?: number) => void;
  addImageElement: (src: string, x?: number, y?: number) => void;
}

const defaultCanvasState: CanvasState = {
  width: 600,
  height: 800,
  backgroundColor: '#ffffff',
  backgroundImage: null,
  elements: [],
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  canvasWidth: 600,
  canvasHeight: 800,
  backgroundColor: '#ffffff',
  backgroundImage: null,
  elements: [],
  selectedElementId: null,
  zoom: 100,
  isLockRatio: false,
  tool: null,
  past: [],
  future: [],

  setCanvasSize: (width, height) => {
    get().saveSnapshot();
    set({ canvasWidth: width, canvasHeight: height });
  },

  setBackgroundColor: (color) => {
    get().saveSnapshot();
    set({ backgroundColor: color, backgroundImage: null });
  },

  setBackgroundImage: (url) => {
    get().saveSnapshot();
    set({ backgroundImage: url });
  },

  resetBackground: () => {
    get().saveSnapshot();
    set({ backgroundColor: '#ffffff', backgroundImage: null });
  },

  setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(200, zoom)) }),
  setTool: (tool) => set({ tool }),
  setLockRatio: (lock) => set({ isLockRatio: lock }),

  addElement: (element) => {
    get().saveSnapshot();
    set((state) => ({ elements: [...state.elements, element] }));
  },

  updateElement: (id, updates) => {
    get().saveSnapshot();
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } as CanvasElement : el
      ),
    }));
  },

  deleteElement: (id) => {
    get().saveSnapshot();
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
  },

  selectElement: (id) => set({ selectedElementId: id }),

  moveElementLayer: (id, direction) => {
    get().saveSnapshot();
    set((state) => {
      const elements = [...state.elements];
      const index = elements.findIndex((el) => el.id === id);
      if (index === -1) return state;

      switch (direction) {
        case 'up':
          if (index < elements.length - 1) {
            [elements[index], elements[index + 1]] = [elements[index + 1], elements[index]];
          }
          break;
        case 'down':
          if (index > 0) {
            [elements[index], elements[index - 1]] = [elements[index - 1], elements[index]];
          }
          break;
        case 'top':
          elements.push(elements.splice(index, 1)[0]);
          break;
        case 'bottom':
          elements.unshift(elements.splice(index, 1)[0]);
          break;
      }
      return { elements };
    });
  },

  alignElement: (id, alignment) => {
    get().saveSnapshot();
    set((state) => {
      const element = state.elements.find((el) => el.id === id);
      if (!element) return state;

      let updates: Partial<CanvasElement> = {};
      if (alignment === 'horizontal-center') {
        updates.x = (state.canvasWidth - element.width) / 2;
      } else if (alignment === 'vertical-center') {
        updates.y = (state.canvasHeight - element.height) / 2;
      }

      return {
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, ...updates } as CanvasElement : el
        ),
      };
    });
  },

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const currentState = get().getCanvasState();
    set({
      past: past.slice(0, -1),
      future: [currentState, ...future],
      canvasWidth: previous.width,
      canvasHeight: previous.height,
      backgroundColor: previous.backgroundColor,
      backgroundImage: previous.backgroundImage,
      elements: previous.elements,
    });
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    const currentState = get().getCanvasState();
    set({
      past: [...past, currentState],
      future: future.slice(1),
      canvasWidth: next.width,
      canvasHeight: next.height,
      backgroundColor: next.backgroundColor,
      backgroundImage: next.backgroundImage,
      elements: next.elements,
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  saveSnapshot: () => {
    const currentState = get().getCanvasState();
    set((state) => ({
      past: [...state.past.slice(-49), currentState],
      future: [],
    }));
  },

  loadState: (state) => {
    set({
      canvasWidth: state.width,
      canvasHeight: state.height,
      backgroundColor: state.backgroundColor,
      backgroundImage: state.backgroundImage,
      elements: state.elements,
      past: [],
      future: [],
      selectedElementId: null,
    });
  },

  getCanvasState: () => ({
    width: get().canvasWidth,
    height: get().canvasHeight,
    backgroundColor: get().backgroundColor,
    backgroundImage: get().backgroundImage,
    elements: get().elements,
  }),

  addTextElement: (x, y, width = 200, height = 40) => {
    const element: TextElement = {
      id: uuidv4(),
      type: 'text',
      x,
      y,
      width,
      height,
      rotation: 0,
      opacity: 1,
      zIndex: get().elements.length,
      content: '双击编辑文字',
      fontFamily: 'Microsoft YaHei',
      fontSize: 24,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'left',
      color: '#333333',
      letterSpacing: 0,
      lineHeight: 1.5,
      shadow: false,
      shadowColor: 'rgba(0,0,0,0.3)',
      shadowBlur: 4,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    };
    get().saveSnapshot();
    set((state) => ({
      elements: [...state.elements, element],
      selectedElementId: element.id,
      tool: null,
    }));
  },

  addShapeElement: (svgContent, x = 100, y = 100) => {
    const element: ShapeElement = {
      id: uuidv4(),
      type: 'shape',
      x,
      y,
      width: 120,
      height: 120,
      rotation: 0,
      opacity: 1,
      zIndex: get().elements.length,
      svgContent,
      fill: '#3b82f6',
      stroke: '',
      strokeWidth: 0,
      shadow: false,
      shadowColor: 'rgba(0,0,0,0.3)',
      shadowBlur: 4,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    };
    get().saveSnapshot();
    set((state) => ({
      elements: [...state.elements, element],
      selectedElementId: element.id,
    }));
  },

  addImageElement: (src, x = 50, y = 50) => {
    const element: ImageElement = {
      id: uuidv4(),
      type: 'image',
      x,
      y,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 1,
      zIndex: get().elements.length,
      src,
      objectFit: 'cover',
      borderRadius: 0,
      shadow: false,
      shadowColor: 'rgba(0,0,0,0.3)',
      shadowBlur: 4,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    };
    get().saveSnapshot();
    set((state) => ({
      elements: [...state.elements, element],
      selectedElementId: element.id,
    }));
  },
}));
