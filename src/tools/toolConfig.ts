import {
  HandGrab,
  MousePointer2,
  Pencil,
  Slash,
  Type,
  Move,
  Edit3
} from "lucide-react";

export const TOOLS = [
  {
    id: "select",
    name: "Select",
    icon: MousePointer2,
  },
  {
    id: "hand",
    name: "Hand",
    icon: HandGrab,
  },
  {
    id: "line",
    name: "Line",
    icon: Slash,
  },
  {
    id: "polyline",
    name: "Polyline",
    icon: Edit3,
  },
  {
    id: "freehand",
    name: "Freehand Line",
    icon: Pencil,
  },
  {
    id: "text",
    name: "Text",
    icon: Type,
  },
  {
    id: "transform",
    name: "Transform",
    icon: Move,
  }
];

export const DEFAULT_TOOL = "hand";
