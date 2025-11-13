import type Feature from "ol/Feature";
import type Geometry from "ol/geom/Geometry";
import type { FeatureLike } from "ol/Feature";
import { isTriangleFeature } from "@/icons/Triangle";
import { isPitFeature } from "@/icons/Pit";
import { isGPFeature } from "@/icons/Gp";
import { isJunctionFeature } from "@/icons/JuctionPoint";

/**
 * Determines if a feature can be selected based on its type.
 * Only allows selection of Polyline, Freehand Line, Arrow, and Legend features.
 * Disables selection for Point, Triangle, Pit, GP, Junction, Tower, and Text features.
 */
export const isSelectableFeature = (feature: FeatureLike): boolean => {
  const geometry = feature.getGeometry();
  if (!geometry) return false;

  const geometryType = geometry.getType();

  // Get feature properties
  const isArrow = feature.get("isArrow");
  const isLegends = feature.get("islegends");
  const isTower = feature.get("isTower");

  // Cannot select point features
  if (geometryType === "Point" || geometryType === "MultiPoint") {
    return false;
  }

  // Cannot select special icon features (Triangle, Pit, GP, Junction)
  if (
    isTriangleFeature(feature as Feature<Geometry>) ||
    isPitFeature(feature as Feature<Geometry>) ||
    isGPFeature(feature as Feature<Geometry>) ||
    isJunctionFeature(feature as Feature<Geometry>)
  ) {
    return false;
  }

  // Cannot select tower features
  if (isTower) {
    return false;
  }

  // CAN select: Arrow features
  if (isArrow) {
    return true;
  }

  // CAN select: Legend features
  if (isLegends) {
    return true;
  }

  // CAN select: LineString/MultiLineString features (Polyline, Freehand)
  if (geometryType === "LineString" || geometryType === "MultiLineString") {
    return true;
  }

  // All other feature types are not selectable
  return false;
};