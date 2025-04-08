// Add missing DOM types
interface Window {
  CanvasGradient: CanvasGradient;
  CanvasPattern: CanvasPattern;
  CanvasRenderingContext2D: CanvasRenderingContext2D;
  HTMLCanvasElement: HTMLCanvasElement;
  HTMLImageElement: HTMLImageElement;
  Path2D: Path2D;
  CanvasLineJoin: CanvasLineJoin;
  CanvasLineCap: CanvasLineCap;
  CanvasTextAlign: CanvasTextAlign;
  CanvasTextBaseline: CanvasTextBaseline;
  HTMLElementEventMap: HTMLElementEventMap;
}

// Add missing BufferSource type
type BufferSource = ArrayBufferView | ArrayBuffer;

// Add missing Canvas types
interface CanvasRenderingContext2DSettings {
  alpha?: boolean;
  desynchronized?: boolean;
  colorSpace?: PredefinedColorSpace;
  willReadFrequently?: boolean;
}

type PredefinedColorSpace = 'srgb' | 'display-p3';

declare type CanvasGradient = any;
declare type CanvasPattern = any;
declare type CanvasRenderingContext2D = any;
declare type HTMLCanvasElement = any;
declare type HTMLImageElement = any;
declare type Path2D = any;
declare type CanvasLineJoin = 'round' | 'bevel' | 'miter';
declare type CanvasLineCap = 'butt' | 'round' | 'square';
declare type CanvasTextAlign = 'left' | 'right' | 'center' | 'start' | 'end';
declare type CanvasTextBaseline = 'top' | 'hanging' | 'middle' | 'alphabetic' | 'ideographic' | 'bottom';
declare type HTMLElementEventMap = any;
