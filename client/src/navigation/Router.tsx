import { createHashRouter, Navigate } from "react-router-dom";
import { Viewer } from "@/components/Viewer";
import { Login } from "@/components/Login";
import ProtectedRoute from "./ProtectedRoute";
import { NewDay } from "@/components/NewDay";

export const router = createHashRouter(
  [
    {
      path: "/",
      element: <Navigate to="/viewer" />,
    },

    {
      path: "/login",
      element: <Login />,
    },

    {
      element: <ProtectedRoute />,
      children: [
        {
          path: "/viewer",
          element: <Viewer />,
        },
      ],
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: "/provision",
          element: <NewDay />,
        },
      ],
    },
  ],
  {
    basename: "",
  }
);

