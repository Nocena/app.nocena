export interface ChallengeData {
    id?: string;
    position: [number, number];
    color: string;
    title: string;
    description: string;
    reward: number;
  }
  
  export interface LocationData {
    longitude: number;
    latitude: number;
  }
  
  export interface MapLibreMapType {
    flyTo: (options: {
      center: [number, number];
      zoom: number;
      essential: boolean;
    }) => void;
    setCenter: (position: [number, number]) => void;
    setZoom: (zoom: number) => void;
    addControl: (control: any, position?: string) => void;
    on: (event: string, callback: (...args: any[]) => void) => void;
    remove: () => void;
  }