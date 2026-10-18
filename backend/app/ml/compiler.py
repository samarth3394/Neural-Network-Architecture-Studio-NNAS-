import torch
import torch.nn as nn
from typing import Dict, Any, List, Optional
from app.ml.schema import ArchitectureGraph
from app.ml.validator import ArchitectureValidator


class CompiledNetwork(nn.Module):
    """
    Dynamically compiled PyTorch neural network built strictly from
    the validated architecture graph.
    """

    def __init__(self, graph: ArchitectureGraph, execution_order: List[str], layer_shapes_map: Dict[str, Any]):
        super().__init__()
        self.graph = graph
        self.execution_order = execution_order
        self.layers = nn.ModuleDict()
        self.node_map = {n.id: n for n in graph.nodes}
        self.layer_shapes_map = layer_shapes_map

        for node_id in self.execution_order:
            node = self.node_map[node_id]
            if node.type == "Input":
                continue

            shape_info = layer_shapes_map.get(node_id)
            in_shape = shape_info["input_shape"] if shape_info else None
            layer_module = self._create_module(node.type, node.parameters or {}, in_shape)
            if layer_module is not None:
                # Sanitize key for ModuleDict
                safe_key = node_id.replace("-", "_")
                self.layers[safe_key] = layer_module

    def _create_module(self, layer_type: str, params: Dict[str, Any], in_shape: Optional[List[int]]) -> Optional[nn.Module]:
        if layer_type in ("Linear", "Dense"):
            out_features = int(params.get("out_features", 64))
            bias = bool(params.get("bias", True))
            in_features = in_shape[-1] if in_shape else 64
            return nn.Linear(in_features=in_features, out_features=out_features, bias=bias)

        elif layer_type == "ReLU":
            return nn.ReLU()

        elif layer_type == "Sigmoid":
            return nn.Sigmoid()

        elif layer_type == "Tanh":
            return nn.Tanh()

        elif layer_type == "Softmax":
            dim = int(params.get("dim", -1))
            return nn.Softmax(dim=dim)

        elif layer_type == "Dropout":
            p = float(params.get("p", 0.2))
            return nn.Dropout(p=p)

        elif layer_type == "BatchNorm1d":
            num_features = in_shape[-1] if in_shape else 64
            eps = float(params.get("eps", 1e-5))
            momentum = float(params.get("momentum", 0.1))
            return nn.BatchNorm1d(num_features=num_features, eps=eps, momentum=momentum)

        elif layer_type == "BatchNorm2d":
            num_features = in_shape[0] if in_shape else 32
            eps = float(params.get("eps", 1e-5))
            momentum = float(params.get("momentum", 0.1))
            return nn.BatchNorm2d(num_features=num_features, eps=eps, momentum=momentum)

        elif layer_type == "Flatten":
            start_dim = int(params.get("start_dim", 1))
            return nn.Flatten(start_dim=start_dim)

        elif layer_type == "Conv2d":
            in_channels = in_shape[0] if in_shape else 1
            out_channels = int(params.get("out_channels", 32))
            kernel_size = int(params.get("kernel_size", 3))
            stride = int(params.get("stride", 1))
            padding = int(params.get("padding", 1))
            bias = bool(params.get("bias", True))
            return nn.Conv2d(
                in_channels=in_channels,
                out_channels=out_channels,
                kernel_size=kernel_size,
                stride=stride,
                padding=padding,
                bias=bias,
            )

        elif layer_type == "MaxPool2d":
            kernel_size = int(params.get("kernel_size", 2))
            stride = int(params.get("stride", 2))
            padding = int(params.get("padding", 0))
            return nn.MaxPool2d(kernel_size=kernel_size, stride=stride, padding=padding)

        elif layer_type == "AvgPool2d":
            kernel_size = int(params.get("kernel_size", 2))
            stride = int(params.get("stride", 2))
            padding = int(params.get("padding", 0))
            return nn.AvgPool2d(kernel_size=kernel_size, stride=stride, padding=padding)

        elif layer_type == "LSTM":
            input_size = in_shape[-1] if in_shape else 64
            hidden_size = int(params.get("hidden_size", 64))
            num_layers = int(params.get("num_layers", 1))
            bidirectional = bool(params.get("bidirectional", False))
            batch_first = bool(params.get("batch_first", True))
            return _LSTMModule(input_size, hidden_size, num_layers, bidirectional, batch_first)

        elif layer_type == "GRU":
            input_size = in_shape[-1] if in_shape else 64
            hidden_size = int(params.get("hidden_size", 64))
            num_layers = int(params.get("num_layers", 1))
            bidirectional = bool(params.get("bidirectional", False))
            batch_first = bool(params.get("batch_first", True))
            return _GRUModule(input_size, hidden_size, num_layers, bidirectional, batch_first)

        elif layer_type == "TransformerEncoder":
            d_model = int(params.get("d_model", 64))
            nhead = int(params.get("nhead", 4))
            dim_feedforward = int(params.get("dim_feedforward", 128))
            num_layers = int(params.get("num_layers", 2))
            dropout = float(params.get("dropout", 0.1))
            encoder_layer = nn.TransformerEncoderLayer(
                d_model=d_model,
                nhead=nhead,
                dim_feedforward=dim_feedforward,
                dropout=dropout,
                batch_first=True,
            )
            return nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

        return None

    def forward(self, x: torch.Tensor, capture_activations: bool = False) -> Any:
        activations = {}
        curr = x

        for node_id in self.execution_order:
            node = self.node_map[node_id]
            if node.type == "Input":
                if capture_activations:
                    activations[node_id] = curr.detach().cpu()
                continue

            safe_key = node_id.replace("-", "_")
            if safe_key in self.layers:
                layer = self.layers[safe_key]
                curr = layer(curr)

            if capture_activations:
                activations[node_id] = curr.detach().cpu()

        if capture_activations:
            return curr, activations
        return curr


class _LSTMModule(nn.Module):
    def __init__(self, input_size: int, hidden_size: int, num_layers: int, bidirectional: bool, batch_first: bool):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            bidirectional=bidirectional,
            batch_first=batch_first,
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out, _ = self.lstm(x)
        return out


class _GRUModule(nn.Module):
    def __init__(self, input_size: int, hidden_size: int, num_layers: int, bidirectional: bool, batch_first: bool):
        super().__init__()
        self.gru = nn.GRU(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            bidirectional=bidirectional,
            batch_first=batch_first,
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out, _ = self.gru(x)
        return out


class ModelCompiler:
    """
    Compiles an ArchitectureGraph into an instantiable, runnable PyTorch model.
    """

    @classmethod
    def compile(cls, graph: ArchitectureGraph) -> CompiledNetwork:
        val_result = ArchitectureValidator.validate_graph(graph)
        if not val_result.is_valid:
            raise ValueError(f"Cannot compile invalid architecture graph: {'; '.join(val_result.errors)}")

        layer_shapes_map = {
            s.node_id: {
                "input_shape": s.input_shape,
                "output_shape": s.output_shape,
                "param_count": s.param_count,
            }
            for s in val_result.layer_shapes
        }

        model = CompiledNetwork(
            graph=graph,
            execution_order=val_result.execution_order,
            layer_shapes_map=layer_shapes_map,
        )
        return model
