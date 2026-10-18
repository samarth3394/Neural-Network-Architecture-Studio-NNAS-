import pytest
import os
import shutil
import torch
from app.ml.schema import ArchitectureGraph, ArchitectureNode, ArchitectureEdge
from app.ml.validator import ArchitectureValidator
from app.ml.compiler import ModelCompiler
from app.ml.code_gen import PyTorchCodeGenerator
from app.ml.datasets import DatasetManager
from app.ml.trainer import TrainingJobExecutor
from app.ml.explainability import ModelExplainability
from app.ml.inference_engine import DeploymentInferenceEngine


@pytest.fixture
def sample_dense_graph() -> ArchitectureGraph:
    nodes = [
        ArchitectureNode(id="n0", type="Input", parameters={"shape": [4]}),
        ArchitectureNode(id="n1", type="Linear", parameters={"out_features": 16}),
        ArchitectureNode(id="n2", type="ReLU"),
        ArchitectureNode(id="n3", type="Linear", parameters={"out_features": 3}),
    ]
    edges = [
        ArchitectureEdge(id="e1", source="n0", target="n1"),
        ArchitectureEdge(id="e2", source="n1", target="n2"),
        ArchitectureEdge(id="e3", source="n2", target="n3"),
    ]
    return ArchitectureGraph(
        id="dense-test",
        name="Dense Test Network",
        task="classification",
        input_shape=[4],
        num_classes=3,
        nodes=nodes,
        edges=edges,
    )


@pytest.fixture
def sample_conv_graph() -> ArchitectureGraph:
    nodes = [
        ArchitectureNode(id="in", type="Input", parameters={"shape": [1, 28, 28]}),
        ArchitectureNode(id="c1", type="Conv2d", parameters={"out_channels": 8, "kernel_size": 3, "padding": 1}),
        ArchitectureNode(id="r1", type="ReLU"),
        ArchitectureNode(id="p1", type="MaxPool2d", parameters={"kernel_size": 2, "stride": 2}),
        ArchitectureNode(id="fl", type="Flatten"),
        ArchitectureNode(id="fc", type="Linear", parameters={"out_features": 10}),
    ]
    edges = [
        ArchitectureEdge(id="e1", source="in", target="c1"),
        ArchitectureEdge(id="e2", source="c1", target="r1"),
        ArchitectureEdge(id="e3", source="r1", target="p1"),
        ArchitectureEdge(id="e4", source="p1", target="fl"),
        ArchitectureEdge(id="e5", source="fl", target="fc"),
    ]
    return ArchitectureGraph(
        id="conv-test",
        name="Conv Test Network",
        task="classification",
        input_shape=[1, 28, 28],
        num_classes=10,
        nodes=nodes,
        edges=edges,
    )


def test_validator_dense_success(sample_dense_graph):
    res = ArchitectureValidator.validate_graph(sample_dense_graph)
    assert res.is_valid is True
    assert len(res.errors) == 0
    assert res.total_parameters > 0
    assert res.execution_order == ["n0", "n1", "n2", "n3"]


def test_validator_conv_success(sample_conv_graph):
    res = ArchitectureValidator.validate_graph(sample_conv_graph)
    assert res.is_valid is True
    assert len(res.errors) == 0
    # Shape after pool: [8, 14, 14] -> flatten: 1568 -> fc 10
    shape_map = {s.node_id: s for s in res.layer_shapes}
    assert shape_map["fl"].output_shape == [1568]
    assert shape_map["fc"].output_shape == [10]


def test_validator_cycle_detection():
    # Graph with cycle: n0 -> n1 -> n2 -> n1
    nodes = [
        ArchitectureNode(id="n0", type="Input", parameters={"shape": [10]}),
        ArchitectureNode(id="n1", type="Linear", parameters={"out_features": 10}),
        ArchitectureNode(id="n2", type="ReLU"),
    ]
    edges = [
        ArchitectureEdge(id="e1", source="n0", target="n1"),
        ArchitectureEdge(id="e2", source="n1", target="n2"),
        ArchitectureEdge(id="e3", source="n2", target="n1"),  # cycle
    ]
    graph = ArchitectureGraph(nodes=nodes, edges=edges)
    res = ArchitectureValidator.validate_graph(graph)
    assert res.is_valid is False
    assert any("cycle" in err.lower() for err in res.errors)


def test_code_generator(sample_dense_graph):
    code = PyTorchCodeGenerator.generate(sample_dense_graph)
    assert "class DenseTestNetwork(nn.Module):" in code
    assert "nn.Linear(in_features=4, out_features=16" in code
    assert "def forward(self, x: torch.Tensor)" in code


def test_model_compiler_and_forward(sample_conv_graph):
    model = ModelCompiler.compile(sample_conv_graph)
    x = torch.randn(2, 1, 28, 28)
    out, acts = model(x, capture_activations=True)
    assert out.shape == (2, 10)
    assert "c1" in acts
    assert acts["c1"].shape == (2, 8, 28, 28)


def test_datasets_manager():
    data = DatasetManager.get_dataset("iris", batch_size=16)
    assert "train_loader" in data
    assert "val_loader" in data
    assert "test_loader" in data
    assert data["metadata"]["task"] == "classification"
    assert data["metadata"]["input_shape"] == [4]


def test_training_executor(sample_dense_graph, tmp_path):
    data = DatasetManager.get_dataset("iris", batch_size=16)
    model = ModelCompiler.compile(sample_dense_graph)

    ckpt_dir = str(tmp_path / "checkpoints")
    result = TrainingJobExecutor.train(
        model=model,
        train_loader=data["train_loader"],
        val_loader=data["val_loader"],
        test_loader=data["test_loader"],
        training_config={"epochs": 3, "learning_rate": 0.01, "optimizer": "adam"},
        checkpoint_dir=ckpt_dir,
        is_classification=True,
    )

    assert result["status"] == "SUCCEEDED"
    assert len(result["metrics_history"]) == 3
    assert "accuracy" in result["evaluation"]
    assert os.path.exists(result["checkpoint_path"])


def test_saliency_and_explainability(sample_conv_graph):
    model = ModelCompiler.compile(sample_conv_graph)
    dummy_img = torch.randn(1, 28, 28)
    saliency_res = ModelExplainability.compute_image_saliency(model, dummy_img)
    assert "saliency_map" in saliency_res
    assert len(saliency_res["saliency_map"]) == 28
    assert len(saliency_res["saliency_map"][0]) == 28
    assert saliency_res["confidence"] > 0.0


def test_inference_engine(sample_dense_graph, tmp_path):
    data = DatasetManager.get_dataset("iris", batch_size=16)
    model = ModelCompiler.compile(sample_dense_graph)
    ckpt_dir = str(tmp_path / "inference_ckpt")
    os.makedirs(ckpt_dir, exist_ok=True)
    ckpt_path = os.path.join(ckpt_dir, "model.pt")

    torch.save({"model_state_dict": model.state_dict()}, ckpt_path)

    engine = DeploymentInferenceEngine(
        checkpoint_path=ckpt_path,
        architecture_graph=sample_dense_graph,
        class_names=["setosa", "versicolor", "virginica"],
    )
    engine.load_and_warmup(warmup_runs=2)
    assert engine.is_ready is True

    # Test single prediction
    single_res = engine.predict([5.1, 3.5, 1.4, 0.2])
    assert single_res["is_single"] is True
    assert "prediction" in single_res["results"]
    assert single_res["latency_ms"] >= 0.0

    # Test batch prediction
    batch_res = engine.predict([[5.1, 3.5, 1.4, 0.2], [6.2, 2.9, 4.3, 1.3]])
    assert batch_res["is_single"] is False
    assert len(batch_res["results"]) == 2

    # Test benchmark
    bench = engine.benchmark(num_requests=10)
    assert bench["p50_latency_ms"] >= 0.0
    assert bench["throughput_req_per_sec"] > 0.0


def test_custom_image_zip_dataset(tmp_path):
    import io
    import zipfile
    from PIL import Image

    zip_path = str(tmp_path / "test_medical_images.zip")
    with zipfile.ZipFile(zip_path, "w") as zf:
        # Create 4 sample images in normal and pneumonia folders
        for i in range(4):
            img = Image.new("L", (32, 32), color=i * 50)
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            zf.writestr(f"dataset/class_normal/norm_{i}.png", buf.getvalue())

        for i in range(4):
            img = Image.new("L", (32, 32), color=200 - i * 30)
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            zf.writestr(f"dataset/class_pneumonia/pneu_{i}.png", buf.getvalue())

    ds = DatasetManager.get_dataset(
        "custom_image_zip",
        csv_path=zip_path,
        batch_size=2,
        image_size=28,
        color_mode="grayscale",
    )
    assert ds["metadata"]["num_classes"] == 2
    assert "class_normal" in ds["metadata"]["classes"]
    assert "class_pneumonia" in ds["metadata"]["classes"]
    assert ds["metadata"]["input_shape"] == [1, 28, 28]
    assert len(ds["train_loader"]) > 0
