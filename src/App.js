import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";

export default function App() {
  console.log("APP RENDERED");

  const [token, setToken] = useState(localStorage.getItem("nowthink_token"));

  useEffect(() => {
    console.log("USE EFFECT STARTED");

    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    console.log("TOKEN FROM URL =", urlToken);

    if (urlToken) {
      console.log("Saving token...");

      localStorage.setItem("nowthink_token", urlToken);

      console.log(
        "Saved token =",
        localStorage.getItem("nowthink_token")
      );

      setToken(urlToken);

      window.history.replaceState({}, "", "/app");
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={token ? <Navigate to="/app" replace /> : <Landing />}
        />

        <Route
          path="/app"
          element={token ? <Dashboard /> : <Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}