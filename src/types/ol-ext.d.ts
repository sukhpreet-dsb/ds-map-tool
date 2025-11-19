declare module 'ol-ext/interaction/Transform' {
  import { Interaction } from 'ol/interaction';
  import { Collection } from 'ol';
  import Feature from 'ol/Feature';
  import { EventsKey } from 'ol/events';
  import { BaseEvent } from 'ol/events';

  export interface TransformOptions {
    enableRotatedTransform?: boolean;
    addCondition?: (event: any) => boolean;
    translateFeature?: boolean;
    translate?: boolean;
    scale?: boolean;
    rotate?: boolean;
    stretch?: boolean;
    keepAspectRatio?: (event: any) => boolean;
    features?: any;
    layers?: any[];
    filter?: (feature: any, layer: any) => boolean;
    select?: any;
    condition?: (event: any) => boolean;
    hitTolerance?: number;
    translateBBox?: boolean;
    noFlip?: boolean;
    selection?: boolean;
    modifyCenter?: (event: any) => boolean;
    keepRectangle?: boolean;
    buffer?: number;
    style?: any;
    pointRadius?: number | number[] | ((feature: any) => number | number[]);
  }

  export default class Transform extends Interaction {
    constructor(options?: TransformOptions);
    on(type: string | string[], listener: (event: any) => void): EventsKey;
    getFeatures(): Collection<Feature>;
    setActive(active: boolean): void;
  }
}

declare module 'ol-ext/interaction/CopyPaste' {
  import { Interaction } from 'ol/interaction';
  import { Collection } from 'ol';
  import Feature from 'ol/Feature';
  import { EventsKey } from 'ol/events';
  import { BaseEvent } from 'ol/events';
  import { VectorSource } from 'ol/source';

  export interface CopyPasteOptions {
    features?: Collection<Feature>;
    destination?: VectorSource;
    sources?: VectorSource | VectorSource[];
    condition?: (event: any) => string | false; // 'copy', 'cut', 'paste', or false
    mapCondition?: (event: any) => boolean;
  }

  export interface CopyPasteEvent extends BaseEvent {
    features: Collection<Feature>;
    type: 'copy' | 'cut' | 'paste';
  }

  export interface CopyOptions {
    features?: Collection<Feature>;
    cut?: boolean;
    silent?: boolean;
  }

  export interface PasteOptions {
    destination?: VectorSource;
    silent?: boolean;
  }

  export default class CopyPaste extends Interaction {
    constructor(options?: CopyPasteOptions);
    on(type: string | string[], listener: (event: CopyPasteEvent) => void): EventsKey;
    copy(options?: CopyOptions): void;
    paste(options?: PasteOptions, features?: Collection<Feature>): void;
    getFeatures(): Collection<Feature>;
    setFeatures(features: Collection<Feature>): void;
    getDestination(): VectorSource;
    setDestination(source: VectorSource): void;
    getSources(): VectorSource[];
    setSources(sources: VectorSource | VectorSource[]): void;
    setActive(active: boolean): void;
  }
}