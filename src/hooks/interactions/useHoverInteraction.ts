import { useEffect, useRef } from 'react';
import type { MapBrowserEvent } from 'ol';
import type Map from 'ol/Map';
import type VectorLayer from 'ol/layer/Vector';
import type { Vector as VectorSource } from 'ol/source';
import type { Feature } from 'ol';
import type { Geometry } from 'ol/geom';
import type { StyleLike } from 'ol/style/Style';
import { createHoverStyle } from '@/utils/styleUtils';
import { STYLE_DEFAULTS } from '@/constants/styleDefaults';

interface UseHoverInteractionOptions {
  map: Map | null;
  vectorLayer: VectorLayer<VectorSource<Feature<Geometry>>> | null;
}

export const useHoverInteraction = ({
  map,
  vectorLayer,
}: UseHoverInteractionOptions): void => {
  const hoveredFeatureRef = useRef<Feature<Geometry> | null>(null);
  const originalStyleRef = useRef<StyleLike | null>(null);

  useEffect(() => {
    if (!map || !vectorLayer) return;

    const handlePointerMove = (evt: MapBrowserEvent<PointerEvent>) => {
      // Skip if dragging (prevents interference with Modify interaction)
      if (evt.dragging) return;

      const pixel = evt.pixel;
      let foundFeature: Feature<Geometry> | undefined;

      // Find feature at pixel, filtering to our vector layer only
      map.forEachFeatureAtPixel(
        pixel,
        (feature, layer) => {
          if (layer === vectorLayer) {
            foundFeature = feature as Feature<Geometry>;
            return true; // Stop searching
          }
          return false;
        },
        {
          hitTolerance: STYLE_DEFAULTS.HIT_TOLERANCE,
        }
      );

      const previousHovered = hoveredFeatureRef.current;

      // If we're hovering the same feature, nothing to do
      if (foundFeature === previousHovered) return;

      // Restore previous feature's original style
      if (previousHovered && originalStyleRef.current !== null) {
        previousHovered.setStyle(originalStyleRef.current);
        hoveredFeatureRef.current = null;
        originalStyleRef.current = null;
      }

      // Apply hover style to new feature
      if (foundFeature) {
        originalStyleRef.current = foundFeature.getStyle() ?? null;
        hoveredFeatureRef.current = foundFeature;
        foundFeature.setStyle(createHoverStyle(foundFeature));
      }
    };

    const handlePointerOut = () => {
      // Restore style when pointer leaves the map
      if (hoveredFeatureRef.current && originalStyleRef.current !== null) {
        hoveredFeatureRef.current.setStyle(originalStyleRef.current);
        hoveredFeatureRef.current = null;
        originalStyleRef.current = null;
      }
    };

    // Use type assertion to work around OpenLayers' incomplete pointermove typing
    (map as any).on('pointermove', handlePointerMove);
    map.getViewport().addEventListener('pointerout', handlePointerOut);

    return () => {
      // Cleanup: restore any hovered feature's style
      if (hoveredFeatureRef.current && originalStyleRef.current !== null) {
        hoveredFeatureRef.current.setStyle(originalStyleRef.current);
      }
      hoveredFeatureRef.current = null;
      originalStyleRef.current = null;

      (map as any).un('pointermove', handlePointerMove);
      map.getViewport().removeEventListener('pointerout', handlePointerOut);
    };
  }, [map, vectorLayer]);
};
