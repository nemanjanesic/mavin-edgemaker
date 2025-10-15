import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Player } from "./Player";

/**
 * React wrapper that owns the Player lifecycle and exposes its API via ref.
 * Usage: <PlayerComponent ref={playerRef} options={{ background: '#fff' }} />
 */
const PlayerComponent = forwardRef(function PlayerComponent({ options }, ref) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || playerRef.current) return;

    // Create the Player once
    playerRef.current = new Player(containerRef.current, options);

    // Example: preload your two models (optional)
    playerRef.current.loadCurve("EB", true).catch(console.error);

    // Cleanup
    return () => {
      playerRef.current?.dispose?.();
      playerRef.current = null;
    };
  }, [options]);

  // Expose a safe subset (and raw player if you want)
  useImperativeHandle(
    ref,
    () => ({
      get raw() {
        return playerRef.current;
      },
      resize: () => playerRef.current?.resize?.(),
      start: () => playerRef.current?.start?.(),
      stop: () => playerRef.current?.stop?.(),
      setBackground: (c) => playerRef.current?.setBackground?.(c),
      loadGLTF: (...args) => playerRef.current?.loadGLTF?.(...args),
      loadCurve: (...args) => playerRef.current?.loadCurve?.(...args),
      getObject: (n) => playerRef.current?.getObject?.(n),
      setGridVisible: (v) => playerRef.current?.setGridVisible?.(v),
      setCameraPosition: (x, y, z) =>
        playerRef.current?.setCameraPosition?.(x, y, z),
      lookAt: (x, y, z) => playerRef.current?.lookAt?.(x, y, z),
    }),
    []
  );

  // The container defines the canvas size
  return (
    <div
      ref={containerRef}
      style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
    />
  );
});

export default PlayerComponent;
