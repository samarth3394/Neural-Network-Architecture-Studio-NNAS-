import torch
import torch.nn as nn
import numpy as np
from typing import Dict, Any, List, Optional


class ModelInspectionHooks:
    """
    Controlled hook manager for extracting:
    - Layer outputs and neuron activations
    - Weight distributions and parameter statistics
    - Gradients when requested
    Safely registers and removes hooks to prevent memory leaks.
    """

    @classmethod
    def extract_weight_distributions(cls, model: nn.Module) -> List[Dict[str, Any]]:
        """
        Calculates histograms and summary statistics of layer weights and biases.
        """
        distributions = []
        for name, param in model.named_parameters():
            if not param.requires_grad:
                continue
            data = param.detach().cpu().numpy().flatten()
            if len(data) == 0:
                continue

            # Compute 20-bin histogram bounded to reasonable range
            hist, bin_edges = np.histogram(data, bins=20)
            distributions.append({
                "parameter_name": name,
                "shape": list(param.shape),
                "num_elements": int(param.numel()),
                "mean": float(np.mean(data)),
                "std": float(np.std(data)),
                "min": float(np.min(data)),
                "max": float(np.max(data)),
                "histogram": {
                    "counts": hist.tolist(),
                    "bin_edges": bin_edges.tolist(),
                },
            })
        return distributions

    @classmethod
    def inspect_sample_forward(
        cls, model: nn.Module, sample_input: torch.Tensor, max_neurons: int = 128
    ) -> Dict[str, Any]:
        """
        Executes a single forward pass with hooks to capture layer-by-layer activations.
        Limits neuron counts to max_neurons to avoid overwhelming memory/network.
        """
        activations: Dict[str, Any] = {}
        handles = []

        def get_hook(layer_name: str):
            def hook(module, input_t, output_t):
                with torch.no_grad():
                    if isinstance(output_t, torch.Tensor):
                        out = output_t.detach().cpu()
                        # If batched, take first sample
                        if out.dim() > 1:
                            sample = out[0]
                        else:
                            sample = out
                        
                        flat = sample.flatten()
                        # Downsample if too large
                        if len(flat) > max_neurons:
                            indices = np.linspace(0, len(flat) - 1, max_neurons, dtype=int)
                            values = flat[indices].tolist()
                        else:
                            values = flat.tolist()

                        activations[layer_name] = {
                            "shape": list(out.shape),
                            "mean_activation": float(out.mean().item()),
                            "std_activation": float(out.std().item()) if out.numel() > 1 else 0.0,
                            "min": float(out.min().item()),
                            "max": float(out.max().item()),
                            "sample_values": values,
                        }
            return hook

        try:
            # Register forward hooks on submodules
            for name, module in model.named_modules():
                if name != "":
                    h = module.register_forward_hook(get_hook(name))
                    handles.append(h)

            model.eval()
            with torch.no_grad():
                # Ensure input has batch dimension
                if sample_input.dim() == len(sample_input.shape) and sample_input.shape[0] != 1:
                    inp = sample_input.unsqueeze(0)
                else:
                    inp = sample_input
                _ = model(inp)

        finally:
            # Remove all hooks immediately
            for h in handles:
                h.remove()

        return activations
