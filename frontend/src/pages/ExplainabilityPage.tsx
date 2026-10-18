import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  RotateCcw,
  Activity,
  Layers,
  HelpCircle,
  Eye,
  Info,
  Rocket,
  ArrowRight,
} from 'lucide-react';
import { api } from '../api/client';
import { useAppStore } from '../store/appStore';

export const ExplainabilityPage: React.FC = () => {
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [probabilities, setProbabilities] = useState<number[]>([]);
  const [saliencyMap, setSaliencyMap] = useState<number[][] | null>(null);
  const [isInferring, setIsInferring] = useState(false);
  const [modelUsed, setModelUsed] = useState<string>('');

  useEffect(() => {
    clearCanvas();
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setPrediction(null);
    setConfidence(null);
    setProbabilities([]);
    setSaliencyMap(null);
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
  };

  const handlePredict = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Downscale 280x280 canvas to 28x28 normalized grayscale matrix
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 28;
    tempCanvas.height = 28;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(canvas, 0, 0, 28, 28);
    const imgData = tempCtx.getImageData(0, 0, 28, 28);
    const pixels: number[][] = [];

    for (let y = 0; y < 28; y++) {
      const row: number[] = [];
      for (let x = 0; x < 28; x++) {
        const idx = (y * 28 + x) * 4;
        const r = imgData.data[idx];
        const g = imgData.data[idx + 1];
        const b = imgData.data[idx + 2];
        const gray = (r + g + b) / 3.0 / 255.0;
        row.push(gray);
      }
      pixels.push(row);
    }

    setIsInferring(true);
    try {
      const res = await api.inferMNISTCanvas(pixels);
      setPrediction(res.predicted_digit);
      setConfidence(res.confidence);
      setProbabilities(res.probabilities);
      setSaliencyMap(res.saliency_heatmap);
      setModelUsed(res.model_used);
    } catch (e: any) {
      alert(`Inference failed: ${e.message}`);
    } finally {
      setIsInferring(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Interactive Inference & Explainability Studio</h1>
        <p className="text-xs text-slate-400 mt-1">
          Draw a handwritten digit, perform real-time model inference, and inspect gradient-based pixel saliency maps
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 280x280 Drawing Pad */}
        <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-4 flex flex-col items-center">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Digit Canvas</span>
            <button
              onClick={clearCanvas}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>

          <div className="rounded-xl border-2 border-studio-700 bg-black p-1 shadow-2xl">
            <canvas
              ref={canvasRef}
              width={280}
              height={280}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onMouseMove={draw}
              className="cursor-crosshair rounded-lg"
            />
          </div>

          <button
            type="button"
            onClick={handlePredict}
            disabled={isInferring}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            <Activity className="h-4 w-4" />
            {isInferring ? 'Inferring Forward Pass...' : 'Run Real Model Inference'}
          </button>
        </div>

        {/* Center: Prediction Results & Probabilities */}
        <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Prediction Results</h3>

          {prediction !== null ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-accent-blue/30 bg-accent-blue/10 p-4">
                <div>
                  <div className="text-xs font-medium text-slate-300">Class Output</div>
                  <div className="text-4xl font-extrabold text-white mt-1">Digit: {prediction}</div>
                  {modelUsed && <div className="text-[10px] text-slate-400 mt-1 font-mono">Model: {modelUsed}</div>}
                </div>
                {confidence !== null && (
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Confidence</div>
                    <div className="text-2xl font-bold text-accent-cyan mt-1">
                      {(confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Class Probabilities Bar Chart */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2">Logit Softmax Distribution</div>
                <div className="space-y-1.5 font-mono text-xs">
                  {probabilities.map((prob, digit) => (
                    <div key={digit} className="flex items-center gap-2">
                      <span className="w-4 text-slate-400">{digit}</span>
                      <div className="flex-1 h-3 rounded bg-studio-950 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            digit === prediction ? 'bg-accent-blue' : 'bg-studio-700'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(2, prob * 100))}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-[10px] text-slate-400">
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-500">
              Draw any single digit (0-9) on the canvas and click "Run Real Model Inference"
            </div>
          )}
        </div>

        {/* Right: Gradient Saliency Heatmap */}
        <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Eye className="h-4 w-4 text-accent-purple" />
              Gradient Saliency Map
            </h3>
            <span className="rounded bg-accent-purple/20 px-2 py-0.5 text-[9px] font-mono text-accent-purple">
              Backprop Attribution
            </span>
          </div>

          {saliencyMap ? (
            <div className="flex flex-col items-center space-y-3">
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(28, 1fr)' }}
                className="gap-[1px] p-2 bg-black rounded-xl border border-studio-700 w-[240px] h-[240px]"
              >
                {saliencyMap.flatMap((row, y) =>
                  row.map((val, x) => {
                    const intensity = Math.min(255, Math.floor(val * 255));
                    // Color mapping: Purple to Cyan/Yellow
                    const r = Math.floor(intensity * 0.9);
                    const g = Math.floor(intensity * 0.4);
                    const b = Math.floor(intensity * 1.0);
                    return (
                      <div
                        key={`${y}-${x}`}
                        style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                        className="w-full h-full"
                        title={`Pixel [${y}, ${x}]: Saliency ${val.toFixed(3)}`}
                      />
                    );
                  })
                )}
              </div>
              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Bright pixels indicate regions where small input perturbations produce the highest gradient changes for class {prediction}.
              </p>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-500">
              Saliency map will appear here after running inference.
            </div>
          )}

          <div className="rounded-lg border border-studio-800 bg-studio-950 p-3 text-[11px] text-slate-400 flex items-start gap-2">
            <Info className="h-4 w-4 text-accent-blue shrink-0 mt-0.5" />
            <div>
              <strong>Scientific Notice:</strong> Observed gradient sensitivity reflects local mathematical gradients at the decision boundary; it does not claim causal importance.
            </div>
          </div>

          {/* Flow Action: Proceed to Deployment */}
          <div className="flex items-center justify-between border-t border-white/[0.08] pt-3">
            <div className="text-xs text-slate-400">
              Model verified with explainability?
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('deployment')}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              <Rocket className="h-3.5 w-3.5" />
              <span>Proceed to Deployment &amp; Serving</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
