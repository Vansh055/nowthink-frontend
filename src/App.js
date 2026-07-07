import { useEffect } from "react";

export default function App() {

  useEffect(() => {

    alert("USE EFFECT");

    const params = new URLSearchParams(window.location.search);

    const token = params.get("token");

    alert(token);

    if(token){
      localStorage.setItem("nowthink_token", token);
      alert("saved");
    }

  }, []);

  return <h1>Hello App</h1>;
}