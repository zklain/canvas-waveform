import { useControls } from "leva";
import { memo, useEffect, useRef, useState } from "react";
import WaveformData from "waveform-data";
import "./App.css";
import { drawBarsWave, getDrawData, normalizeData } from "./utils";
import { useDrag } from "@use-gesture/react";

// todo: colors
// TODO: dpi
// TODO: bars should take full height of the canvas

export const WaveformCanvas = memo(
  ({
    waveform,
    // progress,
    gap = 6,
    barWidth = 3,
    canvasHeight = 120,
  }: {
    waveform: number[];
    // progress: number;
    gap?: number;
    barWidth?: number;
    canvasHeight?: number;
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null!);

    // const dpi = window.devicePixelRatio;
    const width = Math.floor(waveform.length * (gap + barWidth));
    const height = Math.floor(canvasHeight);

    const [progress, setProgress] = useState(0);

    useEffect(() => {
      const width = Math.floor(waveform.length * (gap + barWidth));
      //  const height = Math.floor(canvasHeight);
      canvasRef.current.width = width;
    }, [gap, barWidth, waveform]);

    useControls(() => ({
      progress: {
        value: 0,
        min: 0,
        max: 1,
        onChange: (v) => {
          setProgress(v);
        },
      },
    }));

    // TODO: draw it in request animation frame?
    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        drawBarsWave(canvas, waveform, canvasHeight, progress, {
          barWidth,
          gap,
        });
      }
    }, [waveform, barWidth, gap, canvasHeight, progress, height]);

    const onClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      // const x = e.nativeEvent.offsetX;
      // const progress = x / e.currentTarget.clientWidth;
      // setProgress(progress);
      const { width, left } = e.currentTarget.getBoundingClientRect();
      const offset = e.clientX - left;
      let percentage = (offset / width) * 100;
      if (percentage < 0) percentage = 0;
      if (percentage > 100) percentage = 100;
      setProgress(percentage / 100);
    };

    const dragEvents = useDrag(({ event, down }) => {
      event.stopPropagation?.();
      if (!down) return;
      onClick({
        clientX: (event as MouseEvent).clientX,
        currentTarget: event.currentTarget,
      } as React.MouseEvent<HTMLDivElement>);
    });

    return (
      <div
        {...dragEvents()}
        role="progressbar"
        tabIndex={0}
        aria-valuemin={0}
        aria-live="assertive"
        aria-valuemax={100}
        onClick={onClick}
        style={{
          width: "50vw",
          height: canvasHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: 30,
        }}
      >
        <canvas
          style={{
            width: "100%",
            height: "100%",
            cursor: "pointer",
          }}
          width={width}
          height={height}
          ref={canvasRef}
          draggable={false}
        ></canvas>
      </div>
    );
  }
);

function App() {
  // const audioRef = useRef<HTMLAudioElement>(null!);
  // const [playing, setPlaying] = useState(false);
  const [waveform, setWaveform] = useState<number[] | undefined>(undefined);

  useEffect(() => {
    async function getData() {
      const res = await fetch("/song-data.json");
      if (res.ok) {
        const data = await res.json();
        const waveform = WaveformData.create(data);
        const normalized = normalizeData(waveform);
        const drawData = getDrawData(normalized);
        setWaveform(drawData);
      } else {
        throw new Error("Error fetching data.");
      }
    }
    getData();
  }, [setWaveform]);

  // const onButtonPress = () => {
  //   if (!playing) {
  //     audioRef.current?.play();
  //     setPlaying(true);
  //   } else {
  //     audioRef.current?.pause();
  //     setPlaying(false);
  //   }
  // };

  const { gap, width } = useControls({
    gap: {
      value: 6,
      min: 0,
      max: 10,
    },
    width: {
      value: 3,
      min: 0,
      max: 10,
    },
  });

  return (
    <>
      <div>
        <h1>Waveform</h1>
        {/* <button onClick={onButtonPress}>{playing ? "Pause" : "Play"}</button> */}
        {/* <audio ref={audioRef} src="/URN-resides-in-them.mp3" /> */}
        {waveform ? (
          <WaveformCanvas waveform={waveform} gap={gap} barWidth={width} />
        ) : null}
      </div>
    </>
  );
}

export default App;
