import WaveformData from "waveform-data";

// the data can be processed on the BE using this function
// and then saved in the DB
export function normalizeData(waveform: WaveformData) {
  const channel = waveform.channel(0);
  const peaks = channel.max_array().filter((point) => point >= 0);
  const ratio = Math.max(...peaks) / 100;
  const normalized = peaks.map((point) => Math.round(point / ratio));
  return normalized;
}

const sum = (arr: number[]) =>
  arr.reduce((acc: number, cur: number) => acc + cur);

export function getChunkAvg(
  data: number[],
  chunkSize: number,
  ofBars: number,
  minAmp: number = 0.1
) {
  let i = 0;
  let j = 0;
  const result = [];

  while (i < ofBars) {
    if (j >= data.length) {
      break;
    }

    let chunk = [];
    // last chunk
    if (i === data.length - 1) {
      chunk = data.slice(i);
    } else {
      chunk = data.slice(j, (j += chunkSize));
    }

    const amplitude = Math.round(sum(chunk) / chunk.length + minAmp);
    result.push(amplitude % 2 === 0 ? amplitude : amplitude + 1);
    i++;
  }

  return result;
}

export function getDrawData(waveformData: number[], ofBars: number = 170) {
  const itemsInChunk = Math.floor(waveformData.length / ofBars);
  const avgValues = getChunkAvg(waveformData, itemsInChunk, ofBars);
  return avgValues;
}

export function getBarCoordinates(
  index: number,
  amplitude: number,
  canvasHeight: number,
  barWidth: number = 3,
  gap: number = 3
): [x0: number, y0: number, x1: number, y1: number] {
  // bar height
  //   const height = Math.round((amplitude / 100) * canvasHeight);
  // vertical center
  //   const center = Math.round((canvasHeight - height) / 2);

  // TODO: make bar take the full height of the canvas

  const barHeight = Math.round(amplitude * (canvasHeight / 50));
  const x = Math.round(index * (barWidth + gap));
  const y = Math.round((canvasHeight - barHeight) / 2);

  return [x, y, barWidth, barHeight];
}

type DrawBarsOptions = {
  barWidth: number;
  gap: number;
};

export function drawBarsWave(
  canvas: HTMLCanvasElement,
  waveform: number[],
  canvasHeight: number,
  progress: number,
  options: DrawBarsOptions
) {
  const ctx = canvas.getContext("2d");

  if (!ctx) return;
  const dpi = window.devicePixelRatio;
  //   ctx.scale(dpi, dpi);

  // progress goes from 0 - 1 so we need to multiply it by the length of the waveform
  const p = Math.round(progress * waveform.length);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < waveform.length; i++) {
    const bar = getBarCoordinates(
      i,
      waveform[i],
      canvasHeight,
      options.barWidth,
      options.gap
    );
    ctx.beginPath();
    ctx.rect(...bar);
    if (i < p) {
      ctx.fillStyle = "#f73e00";
    } else {
      ctx.fillStyle = "#4A4A4A";
    }
    ctx.fill();
    ctx.closePath();
  }
}

const scaleY = (amplitude: number, height: number) => {
  const range = 256;
  const offset = 128;
  return height - ((amplitude + offset) * height) / range;
};

export function drawDetailedWavefrom(
  canvas: HTMLCanvasElement,
  waveform: WaveformData
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.scale(1, 1);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#ff7300";
  ctx.fillStyle = "#ff7300";
  ctx.beginPath();

  const channel = waveform.channel(0);

  // Loop forwards, drawing the upper half of the waveform
  for (let x = 0; x < waveform.length; x++) {
    const val = channel.max_sample(x);

    if (val < 0) {
      console.log("val", val);
    }
    ctx.lineTo(x + 0.01, scaleY(val, canvas.height) + 0.5);
  }

  // Loop backwards, drawing the lower half of the waveform
  for (let x = waveform.length - 1; x >= 0; x--) {
    const val = channel.min_sample(x);

    ctx.lineTo(x + 0.01, scaleY(val, canvas.height) + 0.5);
  }

  ctx.closePath();
  ctx.stroke();
  ctx.fill();
}
