import 'leaflet';

declare module 'leaflet' {
  interface MarkerOptions {
    rotationAngle?: number;
    rotationOrigin?: string;
  }

  interface Marker {
    setRotationAngle(angle: number): this;
    setRotationOrigin(origin: string): this;
  }

  interface PathOptions {
    draggable?: boolean;
    transform?: boolean;
  }

  interface Path {
    dragging?: unknown;
    transform?: unknown;
  }
}
