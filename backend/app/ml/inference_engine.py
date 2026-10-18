import time
import os
import torch
import numpy as np
from typing import Dict, Any, List, Optional
from app.ml.schema import ArchitectureGraph
from app.ml.compiler import ModelCompiler, CompiledNetwork


class DeploymentInferenceEngine:
    """
    Production-grade model inference runtime:
    - Model warm-up on startup
    - Single and batch inference with schema and shape validation
    - Precise latency benchmarking (p50, p95, p99, mean)
    - Rollback management and versioned loading
    """

    def __init__(self, checkpoint_path: str, architecture_graph: ArchitectureGraph, class_names: Optional[List[str]] = None):
        self.checkpoint_path = checkpoint_path
        self.architecture_graph = architecture_graph
        self.class_names = class_names or []
        self.model: Optional[CompiledNetwork] = None
        self.is_ready = False
        self.warmup_latency_ms = 0.0

    def load_and_warmup(self, warmup_runs: int = 5) -> None:
        if not os.path.exists(self.checkpoint_path):
            raise FileNotFoundError(f"Checkpoint file not found: {self.checkpoint_path}")

        # Compile model structure
        self.model = ModelCompiler.compile(self.architecture_graph)

        checkpoint = torch.load(self.checkpoint_path, map_location="cpu", weights_only=False)
        if "model_state_dict" in checkpoint:
            self.model.load_state_dict(checkpoint["model_state_dict"])
        else:
            self.model.load_state_dict(checkpoint)

        self.model.eval()

        # Execute warm-up runs to prime JIT/caches
        dummy_shape = [1] + list(self.architecture_graph.input_shape)
        dummy_input = torch.zeros(dummy_shape, dtype=torch.float32)

        start = time.perf_counter()
        with torch.no_grad():
            for _ in range(warmup_runs):
                _ = self.model(dummy_input)
        self.warmup_latency_ms = ((time.perf_counter() - start) / warmup_runs) * 1000.0
        self.is_ready = True

    def predict(self, input_data: List[Any]) -> Dict[str, Any]:
        if not self.is_ready or self.model is None:
            raise RuntimeError("Inference engine is not ready. Call load_and_warmup() first.")

        # Convert input data to tensor
        arr = np.array(input_data, dtype=np.float32)

        expected_shape = list(self.architecture_graph.input_shape)
        prod_expected = int(np.prod(expected_shape))

        # Check if single sample, batch, or matching total elements
        if list(arr.shape) == expected_shape:
            # Single sample: add batch dimension
            tensor = torch.tensor(arr).unsqueeze(0)
            is_single = True
        elif list(arr.shape[1:]) == expected_shape:
            # Batched
            tensor = torch.tensor(arr)
            is_single = False
        elif arr.size == prod_expected:
            # Automatic reshape: single sample provided flattened or 2D matrix
            tensor = torch.tensor(arr.reshape([1] + expected_shape))
            is_single = True
        elif arr.size > 0 and arr.size % prod_expected == 0:
            # Automatic reshape: batched provided flattened
            batch_n = arr.size // prod_expected
            tensor = torch.tensor(arr.reshape([batch_n] + expected_shape))
            is_single = False
        else:
            raise ValueError(
                f"Shape mismatch: provided shape {list(arr.shape)} ({arr.size} numbers), but architecture expects {expected_shape} ({prod_expected} numbers per sample)."
            )

        start = time.perf_counter()
        with torch.no_grad():
            output = self.model(tensor)
        latency_ms = (time.perf_counter() - start) * 1000.0

        is_classification = self.architecture_graph.task == "classification"

        if is_classification:
            probs = torch.softmax(output, dim=-1)
            predicted_classes = torch.argmax(probs, dim=-1).cpu().numpy().tolist()
            confidence_scores = probs.max(dim=-1).values.cpu().numpy().tolist()
            all_probabilities = probs.cpu().numpy().tolist()

            results = []
            for i in range(len(predicted_classes)):
                cls_idx = predicted_classes[i]
                label = self.class_names[cls_idx] if cls_idx < len(self.class_names) else str(cls_idx)
                results.append({
                    "prediction": label,
                    "class_index": cls_idx,
                    "confidence": round(confidence_scores[i], 4),
                    "probabilities": [round(p, 4) for p in all_probabilities[i]],
                })
        else:
            predictions = output.squeeze().cpu().numpy().tolist()
            if isinstance(predictions, float):
                predictions = [predictions]
            results = [{"prediction": round(p, 4)} for p in predictions]

        return {
            "is_single": is_single,
            "batch_size": tensor.shape[0],
            "latency_ms": round(latency_ms, 3),
            "results": results[0] if is_single else results,
        }

    def benchmark(self, num_requests: int = 50) -> Dict[str, Any]:
        """
        Runs empirical latency benchmarking to measure p50, p95, p99, and mean latency.
        """
        if not self.is_ready or self.model is None:
            raise RuntimeError("Inference engine is not ready.")

        dummy_shape = [1] + list(self.architecture_graph.input_shape)
        dummy_input = torch.randn(dummy_shape, dtype=torch.float32)

        latencies = []
        with torch.no_grad():
            for _ in range(num_requests):
                t0 = time.perf_counter()
                _ = self.model(dummy_input)
                latencies.append((time.perf_counter() - t0) * 1000.0)

        latencies.sort()
        p50 = float(np.percentile(latencies, 50))
        p95 = float(np.percentile(latencies, 95))
        p99 = float(np.percentile(latencies, 99))
        mean = float(np.mean(latencies))

        return {
            "num_requests": num_requests,
            "mean_latency_ms": round(mean, 3),
            "p50_latency_ms": round(p50, 3),
            "p95_latency_ms": round(p95, 3),
            "p99_latency_ms": round(p99, 3),
            "throughput_req_per_sec": round(1000.0 / max(0.001, mean), 1),
        }
