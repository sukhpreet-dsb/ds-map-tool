import { GP } from "@/icons/Gp";
import { JunctionPoint } from "@/icons/JunctionPoint";
import { Pits } from "@/icons/Pits";
import { Tower } from "@/icons/Tower";
import { TriangleRI } from "@/icons/Triangle";
import {
  HandGrab,
  MousePointer2,
  Pencil,
  Slash,
  Type,
  Circle,
  ArrowUp,
  Minus
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
    id: "point",
    name: "Point",
    icon: Circle,
  },
  {
    id: "polyline",
    name: "Polyline",
    icon: Slash,
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
    id: "arrow",
    name: "Arrow",
    icon: ArrowUp,
  },
  {
    id: "legends",
    name: "Legends",
    icon: Minus,
  },
  {
    id: 'pits',
    name: 'Pits',
    icon: Pits,
  },
  {
    id: 'triangle',
    name: 'Triangle - R1',
    icon: TriangleRI,
  },
  {
    id: 'gp',
    name: 'GP',
    icon: GP,
  },
  {
    id: 'junction',
    name: 'Junction Point',
    icon: JunctionPoint,
  },
  {
    id: 'tower',
    name: 'Tower',
    icon: Tower,
  }
];

export const DEFAULT_TOOL = "hand";
