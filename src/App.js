import { useEffect } from "react";

export default function App() {

  useEffect(() => {
    alert("SEARCH = " + window.location.search);

    const params = new URLSearchParams(window.location.search);

    alert("TOKEN = " + params.get("token"));

    localStorage.setItem("test", params.get("token"));

    alert("LOCAL = " + localStorage.getItem("test"));
}, []);

  return <h1>Hello App</h1>;
}