from typing import Dict, Any, List


LAYER_REGISTRY: Dict[str, Dict[str, Any]] = {
    "Input": {
        "category": "Input",
        "description": "Defines the input tensor shape entering the neural network.",
        "params": {
            "shape": {"type": "list", "default": [1, 28, 28], "description": "Tensor dimensions excluding batch size (e.g. [1, 28, 28] or [64])"},
        },
    },
    "Linear": {
        "category": "Core",
        "aliases": ["Dense"],
        "description": "Applies an affine linear transformation: y = xA^T + b.",
        "params": {
            "out_features": {"type": "int", "default": 64, "min": 1, "max": 8192, "description": "Size of each output sample"},
            "bias": {"type": "bool", "default": True, "description": "Whether to learn an additive bias"},
        },
    },
    "Dense": {
        "category": "Core",
        "aliases": ["Linear"],
        "description": "Fully connected dense layer (alias for Linear).",
        "params": {
            "out_features": {"type": "int", "default": 64, "min": 1, "max": 8192, "description": "Size of each output sample"},
            "bias": {"type": "bool", "default": True, "description": "Whether to learn an additive bias"},
        },
    },
    "ReLU": {
        "category": "Activation",
        "description": "Applies the rectified linear unit element-wise: max(0, x).",
        "params": {},
    },
    "Sigmoid": {
        "category": "Activation",
        "description": "Applies the sigmoid element-wise: 1 / (1 + exp(-x)).",
        "params": {},
    },
    "Tanh": {
        "category": "Activation",
        "description": "Applies hyperbolic tangent element-wise.",
        "params": {},
    },
    "Softmax": {
        "category": "Activation",
        "description": "Applies the Softmax function along specified dimension.",
        "params": {
            "dim": {"type": "int", "default": -1, "description": "Dimension along which Softmax is computed"},
        },
    },
    "Dropout": {
        "category": "Regularization",
        "description": "Randomly zeroes some elements with probability p during training.",
        "params": {
            "p": {"type": "float", "default": 0.2, "min": 0.0, "max": 0.99, "description": "Dropout probability"},
        },
    },
    "BatchNorm1d": {
        "category": "Normalization",
        "description": "Batch normalization over a 2D or 3D input.",
        "params": {
            "eps": {"type": "float", "default": 1e-5, "description": "Stability constant"},
            "momentum": {"type": "float", "default": 0.1, "description": "Running mean/var momentum"},
        },
    },
    "BatchNorm2d": {
        "category": "Normalization",
        "description": "Batch normalization over a 4D input (N, C, H, W).",
        "params": {
            "eps": {"type": "float", "default": 1e-5, "description": "Stability constant"},
            "momentum": {"type": "float", "default": 0.1, "description": "Running mean/var momentum"},
        },
    },
    "Flatten": {
        "category": "Utility",
        "description": "Flattens contiguous range of dimensions into a single vector.",
        "params": {
            "start_dim": {"type": "int", "default": 1, "description": "First dim to flatten (default 1 excludes batch)"},
        },
    },
    "Conv2d": {
        "category": "Convolutional",
        "description": "2D convolution over an input image composed of multiple input planes.",
        "params": {
            "out_channels": {"type": "int", "default": 32, "min": 1, "max": 2048, "description": "Number of channels produced"},
            "kernel_size": {"type": "int", "default": 3, "min": 1, "max": 31, "description": "Size of convolving kernel"},
            "stride": {"type": "int", "default": 1, "min": 1, "max": 10, "description": "Stride of the convolution"},
            "padding": {"type": "int", "default": 1, "min": 0, "max": 15, "description": "Padding added to all four sides"},
            "bias": {"type": "bool", "default": True, "description": "Whether to learn an additive bias"},
        },
    },
    "MaxPool2d": {
        "category": "Pooling",
        "description": "Applies a 2D max pooling over an input signal.",
        "params": {
            "kernel_size": {"type": "int", "default": 2, "min": 1, "max": 10, "description": "Size of the max pooling window"},
            "stride": {"type": "int", "default": 2, "min": 1, "max": 10, "description": "Stride of the window"},
            "padding": {"type": "int", "default": 0, "min": 0, "max": 10, "description": "Padding added to sides"},
        },
    },
    "AvgPool2d": {
        "category": "Pooling",
        "description": "Applies a 2D average pooling over an input signal.",
        "params": {
            "kernel_size": {"type": "int", "default": 2, "min": 1, "max": 10, "description": "Size of the avg pooling window"},
            "stride": {"type": "int", "default": 2, "min": 1, "max": 10, "description": "Stride of the window"},
            "padding": {"type": "int", "default": 0, "min": 0, "max": 10, "description": "Padding added to sides"},
        },
    },
    "LSTM": {
        "category": "Recurrent",
        "description": "Multi-layer long short-term memory (LSTM) RNN.",
        "params": {
            "hidden_size": {"type": "int", "default": 64, "min": 1, "max": 1024, "description": "Features in hidden state"},
            "num_layers": {"type": "int", "default": 1, "min": 1, "max": 8, "description": "Number of recurrent layers"},
            "bidirectional": {"type": "bool", "default": False, "description": "If True, becomes bidirectional"},
            "batch_first": {"type": "bool", "default": True, "description": "If True, input/output are (batch, seq, feature)"},
        },
    },
    "GRU": {
        "category": "Recurrent",
        "description": "Multi-layer gated recurrent unit (GRU) RNN.",
        "params": {
            "hidden_size": {"type": "int", "default": 64, "min": 1, "max": 1024, "description": "Features in hidden state"},
            "num_layers": {"type": "int", "default": 1, "min": 1, "max": 8, "description": "Number of recurrent layers"},
            "bidirectional": {"type": "bool", "default": False, "description": "If True, becomes bidirectional"},
            "batch_first": {"type": "bool", "default": True, "description": "If True, input/output are (batch, seq, feature)"},
        },
    },
    "TransformerEncoder": {
        "category": "Attention",
        "description": "Stack of Transformer encoder layers with multi-head self-attention.",
        "params": {
            "d_model": {"type": "int", "default": 64, "min": 8, "max": 1024, "description": "Number of expected features in input"},
            "nhead": {"type": "int", "default": 4, "min": 1, "max": 16, "description": "Number of heads in multiheadattention"},
            "dim_feedforward": {"type": "int", "default": 128, "min": 16, "max": 2048, "description": "Dimension of feedforward network"},
            "num_layers": {"type": "int", "default": 2, "min": 1, "max": 12, "description": "Number of sub-encoder-layers in encoder"},
            "dropout": {"type": "float", "default": 0.1, "min": 0.0, "max": 0.5, "description": "Dropout value"},
        },
    },
}
