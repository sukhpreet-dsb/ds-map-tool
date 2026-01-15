import { Style, Stroke, Fill } from "ol/style";
import { Feature } from "ol";
import { GeometryCollection } from "ol/geom";
import { Vector as VectorSource } from "ol/source";
import type { Geometry } from "ol/geom";
import { createCirclePolygon } from "@/utils/geometryUtils";
import { applyOpacityToColor } from "@/utils/colorUtils";

/**
 * Create a single Feature that contains both outer + inner circles
 * as a GeometryCollection so they behave as one selectable feature.
 * Using Polygons instead of Circles for GeoJSON compatibility.
 */
export const createGPGeometry = (
  center: number[],
  outerRadius: number = 8,
  innerRadius: number = 2
): Feature<Geometry> => {
  // Convert circles to polygons for GeoJSON compatibility
  const outerCircle = createCirclePolygon(center, outerRadius, 32);
  const innerCircle = createCirclePolygon(center, innerRadius, 16);

  const geomCollection = new GeometryCollection([outerCircle, innerCircle]);

  return new Feature({
    geometry: geomCollection,
  });
};

/**
 * Returns styles for the GP feature.
 * Each Style targets a specific sub-geometry inside the GeometryCollection
 * by using the `geometry` option (function returning the sub-geometry).
 * @param opacity - Opacity value (0-1), defaults to 1
 */
export const getGPStyles = (opacity: number = 1): Style[] => {
  const outerStrokeColor = applyOpacityToColor("#000000", opacity);
  const outerFillColor = applyOpacityToColor("#9333ea", opacity); // purple

  const outerStyle = new Style({
    geometry: (feature) => {
      const geom = feature.getGeometry() as GeometryCollection | null;
      // guard - return whole geometry if collection isn't present
      if (!geom || typeof (geom as any).getGeometries !== "function")
        return geom;
      return (geom as any).getGeometries()[0]; // outer circle
    },
    stroke: new Stroke({
      color: outerStrokeColor,
      width: 1,
    }),
    fill: new Fill({
      color: outerFillColor,
    }),
  });

  const innerStrokeColor = applyOpacityToColor("#000000", opacity);
  const innerFillColor = applyOpacityToColor("#000000", opacity);

  const innerStyle = new Style({
    geometry: (feature) => {
      const geom = feature.getGeometry() as GeometryCollection | null;
      if (!geom || typeof (geom as any).getGeometries !== "function")
        return geom;
      return (geom as any).getGeometries()[1]; // inner circle
    },
    stroke: new Stroke({
      color: innerStrokeColor,
      width: 1,
    }),
    fill: new Fill({
      color: innerFillColor,
    }),
  });

  return [outerStyle, innerStyle];
};

/**
 * Convenience alias that returns the same styles as getGPStyles,
 * for code that expects `getStyle()` (singular).
 * @param opacity - Opacity value (0-1), defaults to 1
 */
export const getGPStyle = (opacity: number = 1): Style[] => {
  return getGPStyles(opacity);
};

/**
 * Handles click event to create GP symbol (single Feature with GeometryCollection)
 */
export const handleGPClick = (
  vectorSource: VectorSource,
  coordinate: number[],
  outerRadius: number = 8,
  innerRadius: number = 2
): Feature<Geometry> | null => {
  try {
    const gpFeature = createGPGeometry(coordinate, outerRadius, innerRadius);

    // Tag feature for identification
    gpFeature.set("isGP", true);
    gpFeature.set("nonEditable", true);

    // Add label/name properties for text display
    gpFeature.set("label", "name");
    gpFeature.set("name", `GP`);

    // Add to vector source (single feature = selectable as one unit)
    vectorSource.addFeature(gpFeature);

    return gpFeature;
  } catch (error) {
    console.error("Error creating GP:", error);
    return null;
  }
};

/**
 * Checks if a feature is a GP symbol
 */
export const isGPFeature = (feature: Feature): boolean => {
  return feature.get("isGP") === true;
};

/**
 * GP tool utilities
 */
export const gpUtils = {
  createGeometry: createGPGeometry,
  getStyles: getGPStyles,
  getStyle: getGPStyle, // alias for compatibility
  handleClick: handleGPClick,
  isGP: isGPFeature,
};
