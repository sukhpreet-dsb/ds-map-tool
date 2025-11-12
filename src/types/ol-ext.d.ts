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