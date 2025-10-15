import { useRef, useEffect } from "react";
import "./App.css";
import PlayerComponent from "./Player/PlayerComponent";

function App() {
  const playerApi = useRef(null);

  const curves = [
    "EA",
    "EB",
    "EC",
    "ED",
    "EE",
    "EF",
    "EG",
    "EH",
    "EI",
    "EK",
    "EM",
  ];

  useEffect(() => {
    // Example reference calls
    const p = playerApi.current;
    if (!p) return;

    // tweak background after 1s
    const id = setTimeout(() => {
      p.setBackground("#ffffff");
      p.setGridVisible(true);
      p.setCameraPosition(1.5, 1.5, 1.5);
      p.lookAt(0, 0, 0);
    }, 1000);

    return () => clearTimeout(id);
  }, []);

  return (
    <>
      <PlayerComponent
        ref={playerApi}
        options={{
          background: "white",
          dracoPath: "./draco/", // public/draco/*
          enableGrid: true,
        }}
      />
      <div className="fixed top-20 right-20 bg-gray-600 p-3">
        <p>Select EDGE</p>
        <br />
        <div className="flex flex-col gap-[5px]">
          {curves.map((c) => (
            <button
              key={c}
              className="w-[100%]"
              onClick={() => playerApi.current?.loadCurve(c)}
            >
              EDGE {c}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
