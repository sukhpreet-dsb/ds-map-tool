import { createBrowserRouter } from "react-router";
import MapEditor from "./pages/MapEditor";
import LayoutEditor from "./pages/LayoutEditor";
import LayoutsList from "./pages/LayoutsList";
import JobWelcome from "./components/JobWelcome";

export const router = createBrowserRouter([
  {
    path: "/",
    children: [
      { index: true, Component: JobWelcome },
      { path: "map", Component: MapEditor },
      { path: "layouts", Component: LayoutsList },
      { path: "layout", Component: LayoutEditor },
      { path: "layout/:layoutId", Component: LayoutEditor },
    ],
  },
]);
