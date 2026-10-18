import math
from typing import List, Dict, Any, Tuple, Set
from collections import defaultdict, deque
from app.ml.schema import ArchitectureGraph, ValidationResult, LayerShapeInfo
from app.ml.registry import LAYER_REGISTRY


class ArchitectureValidator:
    """
    Validates neural network architecture graphs:
    - Directed Acyclic Graph (DAG) topology & cycles
    - Input node reachability & execution order (Topological Sort)
    - Tensor shape inference across all layers
    - Parameter calculation (trainable & total)
    - Layer-specific constraints (e.g. kernel sizes vs feature map dimensions)
    """

    @classmethod
    def validate_graph(cls, graph: ArchitectureGraph) -> ValidationResult:
        errors: List[str] = []
        warnings: List[str] = []
        node_map = {n.id: n for n in graph.nodes}

        if not graph.nodes:
            return ValidationResult(
                is_valid=False,
                errors=["Architecture graph has no layers/nodes."],
            )

        # 1. Check Input Node
        input_nodes = [n for n in graph.nodes if n.type == "Input"]
        if not input_nodes:
            errors.append("Architecture requires at least one 'Input' layer.")
            return ValidationResult(is_valid=False, errors=errors)
        if len(input_nodes) > 1:
            warnings.append("Multiple 'Input' nodes detected. Using primary input node.")

        primary_input = input_nodes[0]

        # 2. Build Adjacency and In-Degree
        adj: Dict[str, List[str]] = defaultdict(list)
        rev_adj: Dict[str, List[str]] = defaultdict(list)
        in_degree: Dict[str, int] = {n.id: 0 for n in graph.nodes}

        for edge in graph.edges:
            if edge.source not in node_map:
                errors.append(f"Edge references non-existent source node '{edge.source}'.")
                continue
            if edge.target not in node_map:
                errors.append(f"Edge references non-existent target node '{edge.target}'.")
                continue
            adj[edge.source].append(edge.target)
            rev_adj[edge.target].append(edge.source)
            in_degree[edge.target] += 1

        if errors:
            return ValidationResult(is_valid=False, errors=errors)

        # 3. Cycle Detection and Topological Sort (Kahn's Algorithm)
        queue = deque([node_id for node_id, deg in in_degree.items() if deg == 0])
        execution_order: List[str] = []

        while queue:
            curr = queue.popleft()
            execution_order.append(curr)
            for neighbor in adj[curr]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(execution_order) != len(graph.nodes):
            errors.append("Architecture contains invalid cycle or loop. Cycles are not permitted in feedforward architectures.")
            return ValidationResult(is_valid=False, errors=errors)

        # 4. Check for Disconnected Nodes
        reachable_from_input: Set[str] = set()
        dfs_queue = deque([primary_input.id])
        while dfs_queue:
            curr = dfs_queue.popleft()
            if curr not in reachable_from_input:
                reachable_from_input.add(curr)
                for neighbor in adj[curr]:
                    dfs_queue.append(neighbor)

        disconnected_nodes = [n.id for n in graph.nodes if n.id not in reachable_from_input]
        if disconnected_nodes:
            warnings.append(f"Nodes not connected to input path: {', '.join(disconnected_nodes)}")

        # 5. Tensor Shape Inference & Parameter Counting
        layer_shapes: List[LayerShapeInfo] = []
        node_out_shapes: Dict[str, List[int]] = {}
        total_params = 0
        trainable_params = 0

        # Initial shape from Input node parameters or graph input_shape
        input_params = primary_input.parameters or {}
        raw_input_shape = input_params.get("shape", graph.input_shape)
        current_shape = list(raw_input_shape)
        node_out_shapes[primary_input.id] = current_shape

        layer_shapes.append(
            LayerShapeInfo(
                node_id=primary_input.id,
                layer_type="Input",
                input_shape=current_shape,
                output_shape=current_shape,
                param_count=0,
                trainable_params=0,
            )
        )

        for node_id in execution_order:
            node = node_map[node_id]
            if node.id == primary_input.id:
                continue

            incoming = rev_adj[node.id]
            if not incoming:
                # Disconnected root node (other than primary input)
                continue

            # Incoming tensor shape
            parent_id = incoming[0]
            if parent_id not in node_out_shapes:
                continue

            in_shape = node_out_shapes[parent_id]
            layer_type = node.type
            params = node.parameters or {}

            node_out_shape, n_params, n_trainable, shape_errors = cls._infer_layer(
                layer_type=layer_type,
                in_shape=in_shape,
                params=params,
                node_id=node.id,
            )

            if shape_errors:
                errors.extend(shape_errors)
                break

            node_out_shapes[node.id] = node_out_shape
            total_params += n_params
            trainable_params += n_trainable

            layer_shapes.append(
                LayerShapeInfo(
                    node_id=node.id,
                    layer_type=layer_type,
                    input_shape=in_shape,
                    output_shape=node_out_shape,
                    param_count=n_params,
                    trainable_params=n_trainable,
                )
            )

        is_valid = len(errors) == 0

        return ValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            total_parameters=total_params,
            trainable_parameters=trainable_params,
            layer_shapes=layer_shapes,
            execution_order=execution_order,
        )

    @classmethod
    def _infer_layer(
        cls, layer_type: str, in_shape: List[int], params: Dict[str, Any], node_id: str
    ) -> Tuple[List[int], int, int, List[str]]:
        errors: List[str] = []
        out_shape = list(in_shape)
        total_p = 0
        trainable_p = 0

        try:
            if layer_type in ("Linear", "Dense"):
                out_features = int(params.get("out_features", 64))
                bias = bool(params.get("bias", True))
                if len(in_shape) == 1:
                    in_features = in_shape[0]
                elif len(in_shape) == 2:
                    in_features = in_shape[1]
                else:
                    # Multi-dimensional: must be flattened first
                    errors.append(
                        f"Node '{node_id}' (Linear): expected 1D or 2D input (e.g. [features] or [seq, features]), but received tensor with shape {in_shape}. Add a 'Flatten' layer beforehand."
                    )
                    return out_shape, 0, 0, errors

                out_shape = [out_features] if len(in_shape) == 1 else [in_shape[0], out_features]
                total_p = (in_features * out_features) + (out_features if bias else 0)
                trainable_p = total_p

            elif layer_type == "Conv2d":
                if len(in_shape) != 3:
                    errors.append(
                        f"Node '{node_id}' (Conv2d): requires 3D input [channels, height, width], received {in_shape}."
                    )
                    return out_shape, 0, 0, errors

                c_in, h_in, w_in = in_shape[0], in_shape[1], in_shape[2]
                out_channels = int(params.get("out_channels", 32))
                kernel_size = int(params.get("kernel_size", 3))
                stride = int(params.get("stride", 1))
                padding = int(params.get("padding", 1))
                bias = bool(params.get("bias", True))

                h_out = math.floor((h_in + 2 * padding - kernel_size) / stride) + 1
                w_out = math.floor((w_in + 2 * padding - kernel_size) / stride) + 1

                if h_out <= 0 or w_out <= 0:
                    errors.append(
                        f"Node '{node_id}' (Conv2d): spatial dimensions collapsed to [{out_channels}, {h_out}, {w_out}]. Reduce kernel size or stride, or increase padding."
                    )
                    return out_shape, 0, 0, errors

                out_shape = [out_channels, h_out, w_out]
                total_p = (out_channels * c_in * kernel_size * kernel_size) + (out_channels if bias else 0)
                trainable_p = total_p

            elif layer_type in ("MaxPool2d", "AvgPool2d"):
                if len(in_shape) != 3:
                    errors.append(
                        f"Node '{node_id}' ({layer_type}): requires 3D input [channels, height, width], received {in_shape}."
                    )
                    return out_shape, 0, 0, errors

                c_in, h_in, w_in = in_shape[0], in_shape[1], in_shape[2]
                kernel_size = int(params.get("kernel_size", 2))
                stride = int(params.get("stride", 2))
                padding = int(params.get("padding", 0))

                h_out = math.floor((h_in + 2 * padding - kernel_size) / stride) + 1
                w_out = math.floor((w_in + 2 * padding - kernel_size) / stride) + 1

                if h_out <= 0 or w_out <= 0:
                    errors.append(
                        f"Node '{node_id}' ({layer_type}): spatial dimensions collapsed to [{c_in}, {h_out}, {w_out}]."
                    )
                    return out_shape, 0, 0, errors

                out_shape = [c_in, h_out, w_out]
                total_p = 0
                trainable_p = 0

            elif layer_type == "Flatten":
                start_dim = int(params.get("start_dim", 1))
                # Flat dimension is the product of all elements
                prod = 1
                for d in in_shape:
                    prod *= d
                out_shape = [prod]
                total_p = 0
                trainable_p = 0

            elif layer_type == "BatchNorm1d":
                features = in_shape[-1]
                total_p = 2 * features  # gamma and beta
                trainable_p = total_p

            elif layer_type == "BatchNorm2d":
                if len(in_shape) != 3:
                    errors.append(f"Node '{node_id}' (BatchNorm2d) expects 3D input [channels, H, W], received {in_shape}.")
                    return out_shape, 0, 0, errors
                channels = in_shape[0]
                total_p = 2 * channels
                trainable_p = total_p

            elif layer_type in ("ReLU", "Sigmoid", "Tanh", "Softmax", "Dropout"):
                # Dimension preserving
                out_shape = list(in_shape)
                total_p = 0
                trainable_p = 0

            elif layer_type in ("LSTM", "GRU"):
                hidden_size = int(params.get("hidden_size", 64))
                num_layers = int(params.get("num_layers", 1))
                bidirectional = bool(params.get("bidirectional", False))
                num_directions = 2 if bidirectional else 1

                if len(in_shape) == 1:
                    seq_len = 1
                    input_size = in_shape[0]
                elif len(in_shape) == 2:
                    seq_len, input_size = in_shape[0], in_shape[1]
                else:
                    errors.append(f"Node '{node_id}' ({layer_type}): expects 1D or 2D [seq_len, input_size], received {in_shape}.")
                    return out_shape, 0, 0, errors

                out_shape = [seq_len, hidden_size * num_directions]

                factor = 4 if layer_type == "LSTM" else 3
                # First layer: input_size -> hidden_size
                p_layer1 = factor * (input_size * hidden_size + hidden_size * hidden_size + 2 * hidden_size) * num_directions
                # Remaining layers
                p_rem = 0
                for _ in range(1, num_layers):
                    in_h = hidden_size * num_directions
                    p_rem += factor * (in_h * hidden_size + hidden_size * hidden_size + 2 * hidden_size) * num_directions

                total_p = p_layer1 + p_rem
                trainable_p = total_p

            elif layer_type == "TransformerEncoder":
                d_model = int(params.get("d_model", 64))
                nhead = int(params.get("nhead", 4))
                dim_feedforward = int(params.get("dim_feedforward", 128))
                num_layers = int(params.get("num_layers", 2))

                if d_model % nhead != 0:
                    errors.append(f"Node '{node_id}' (TransformerEncoder): d_model ({d_model}) must be divisible by nhead ({nhead}).")
                    return out_shape, 0, 0, errors

                if in_shape[-1] != d_model:
                    errors.append(f"Node '{node_id}' (TransformerEncoder): input feature dimension ({in_shape[-1]}) does not match d_model ({d_model}).")
                    return out_shape, 0, 0, errors

                out_shape = list(in_shape)
                # Self-attention: 4 * (d_model * d_model + d_model)
                attn_params = 4 * d_model * d_model + 4 * d_model
                # Feedforward: 2 * (d_model * dim_ff) + dim_ff + d_model
                ff_params = 2 * d_model * dim_feedforward + dim_feedforward + d_model
                # Layer norms: 2 * (2 * d_model)
                norm_params = 4 * d_model
                single_layer_params = attn_params + ff_params + norm_params

                total_p = single_layer_params * num_layers
                trainable_p = total_p

        except Exception as ex:
            errors.append(f"Error calculating shape for node '{node_id}' ({layer_type}): {str(ex)}")

        return out_shape, total_p, trainable_p, errors
