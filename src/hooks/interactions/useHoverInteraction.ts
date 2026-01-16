import { useEffect, useRef } from 'react';
import type { MapBrowserEvent } from 'ol';
import type Map from 'ol/Map';
import type VectorLayer from 'ol/layer/Vector';
import type { Vector as VectorSource } from 'ol/source';
import type { Feature } from 'ol';
import type { Geometry } from 'ol/geom';
import type { StyleLike } from 'ol/style/Style';
import type { Select } from 'ol/interaction';
import { createHoverStyle } from '@/utils/styleUtils';
import { STYLE_DEFAULTS } from '@/constants/styleDefaults';

interface UseHoverInteractionOptions {
  map: Map | null;
  vectorLayer: VectorLayer<VectorSource<Feature<Geometry>>> | null;
  selectInteraction?: Select | null;
}

export const useHoverInteraction = ({
  map,
  vectorLayer,
  selectInteraction,
}: UseHoverInteractionOptions): void => {
  const hoveredFeatureRef = useRef<Feature<Geometry> | null>(null);
  // Store original style - undefined means "use layer default style"
  const originalStyleRef = useRef<StyleLike | undefined>(undefined);

  useEffect(() => {
    if (!map || !vectorLayer) return;

    const restoreStyle = (feature: Feature<Geometry>) => {
      // Always set to undefined to restore layer default styling
      // This ensures the layer's style function is used
      feature.setStyle(undefined);
      hoveredFeatureRef.current = null;
      originalStyleRef.current = undefined;
    };

    // Helper to check if a feature is currently selected
    const isFeatureSelected = (feature: Feature<Geometry>): boolean => {
      if (!selectInteraction) return false;
      const selectedFeatures = selectInteraction.getFeatures().getArray();
      return selectedFeatures.includes(feature);
    };

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
      if (previousHovered) {
        restoreStyle(previousHovered);
      }

      // Apply hover style to new feature (skip if it's selected)
      if (foundFeature && !isFeatureSelected(foundFeature)) {
        originalStyleRef.current = foundFeature.getStyle();
        hoveredFeatureRef.current = foundFeature;
        foundFeature.setStyle(createHoverStyle(foundFeature));
      }
    };

    const handlePointerOut = () => {
      // Restore style when pointer leaves the map
      if (hoveredFeatureRef.current) {
        restoreStyle(hoveredFeatureRef.current);
      }
    };

    // Use type assertion to work around OpenLayers' incomplete pointermove typing
    (map as any).on('pointermove', handlePointerMove);
    map.getViewport().addEventListener('pointerout', handlePointerOut);

    return () => {
      // Cleanup: restore any hovered feature's style
      if (hoveredFeatureRef.current) {
        restoreStyle(hoveredFeatureRef.current);
      }

      (map as any).un('pointermove', handlePointerMove);
      map.getViewport().removeEventListener('pointerout', handlePointerOut);
    };
  }, [map, vectorLayer, selectInteraction]);
};
