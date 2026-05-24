import { useEditorStore } from '../store';
import { TextElement, ShapeElement, ImageElement } from '../types';
import CanvasProperties from './properties/CanvasProperties';
import TextProperties from './properties/TextProperties';
import ShapeProperties from './properties/ShapeProperties';
import ImageProperties from './properties/ImageProperties';

export default function RightPanel() {
  const { elements, selectedElementId } = useEditorStore();
  const selectedElement = elements.find((el) => el.id === selectedElementId);

  return (
    <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
      <div className="p-4">
        {!selectedElement ? (
          <CanvasProperties />
        ) : selectedElement.type === 'text' ? (
          <TextProperties element={selectedElement as TextElement} />
        ) : selectedElement.type === 'shape' ? (
          <ShapeProperties element={selectedElement as ShapeElement} />
        ) : selectedElement.type === 'image' ? (
          <ImageProperties element={selectedElement as ImageElement} />
        ) : null}
      </div>
    </div>
  );
}
