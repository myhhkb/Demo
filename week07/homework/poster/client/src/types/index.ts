export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface Poster {
  id: number;
  user_id: number;
  title: string;
  width: number;
  height: number;
  data: string;
  thumbnail: string;
  created_at: string;
  updated_at: string;
}

export type ElementType = 'text' | 'shape' | 'image';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  color: string;
  letterSpacing: number;
  lineHeight: number;
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  svgContent: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  objectFit: 'cover' | 'contain' | 'fill';
  borderRadius: number;
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

export type CanvasElement = TextElement | ShapeElement | ImageElement;

export interface CanvasState {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage: string | null;
  elements: CanvasElement[];
}

export interface HistoryState {
  past: CanvasState[];
  present: CanvasState;
  future: CanvasState[];
}
