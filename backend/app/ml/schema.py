from typing import List, Dict, Any, Optional, Literal, Union
from pydantic import BaseModel, Field, model_validator


LayerType = Literal[
    "Input",
    "Linear",
    "Dense",
    "ReLU",
    "Sigmoid",
    "Tanh",
    "Dropout",
    "BatchNorm1d",
    "BatchNorm2d",
    "Flatten",
    "Conv2d",
    "MaxPool2d",
    "AvgPool2d",
    "LSTM",
    "GRU",
    "TransformerEncoder",
    "Softmax",
]


class NodePosition(BaseModel):
    x: float = 0.0
    y: float = 0.0


class ArchitectureNode(BaseModel):
    id: str
    type: LayerType
    name: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)
    position: Optional[NodePosition] = None


class ArchitectureEdge(BaseModel):
    id: str
    source: str
    target: str
    source_handle: Optional[str] = None
    target_handle: Optional[str] = None


class ArchitectureGraph(BaseModel):
    id: Optional[str] = None
    name: str = "Custom Architecture"
    version: str = "1.0.0"
    description: Optional[str] = ""
    task: Literal["classification", "regression"] = "classification"
    framework: Literal["pytorch"] = "pytorch"
    input_shape: List[int] = Field(default_factory=lambda: [1, 28, 28])
    num_classes: Optional[int] = 10
    nodes: List[ArchitectureNode] = Field(default_factory=list)
    edges: List[ArchitectureEdge] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_unique_node_ids(self) -> "ArchitectureGraph":
        ids = [n.id for n in self.nodes]
        if len(ids) != len(set(ids)):
            raise ValueError("Duplicate node IDs found in architecture graph.")
        return self


class LayerShapeInfo(BaseModel):
    node_id: str
    layer_type: str
    input_shape: List[int]
    output_shape: List[int]
    param_count: int
    trainable_params: int


class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    total_parameters: int = 0
    trainable_parameters: int = 0
    layer_shapes: List[LayerShapeInfo] = Field(default_factory=list)
    execution_order: List[str] = Field(default_factory=list)
