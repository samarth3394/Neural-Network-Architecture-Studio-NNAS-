import json
from app.db.session import engine, SessionLocal, Base
from app.db.models import User, Workspace, WorkspaceMember, Project, Architecture, DatasetModel
from app.core.security import get_password_hash
from app.ml.schema import ArchitectureGraph, ArchitectureNode, ArchitectureEdge
from app.ml.validator import ArchitectureValidator


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if default user exists
        admin = db.query(User).filter(User.email == "admin@nnas.local").first()
        if not admin:
            admin = User(
                email="admin@nnas.local",
                hashed_password=get_password_hash("Admin123!*"),
                full_name="Lead ML Architect",
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        # Default Workspace
        ws = db.query(Workspace).filter(Workspace.slug == "default").first()
        if not ws:
            ws = Workspace(
                name="Default Production Workspace",
                slug="default",
                description="Core AI engineering and experimentation workspace for NNAS.",
                owner_id=admin.id,
            )
            db.add(ws)
            db.commit()
            db.refresh(ws)

            member = WorkspaceMember(
                workspace_id=ws.id,
                user_id=admin.id,
                role="owner",
            )
            db.add(member)
            db.commit()

        # Default Project
        proj = db.query(Project).filter(Project.workspace_id == ws.id).first()
        if not proj:
            proj = Project(
                workspace_id=ws.id,
                name="Deep Learning Architecture Showcase",
                description="Production showcase with CNN, MLP, and non-linear classification architectures.",
                created_by=admin.id,
            )
            db.add(proj)
            db.commit()
            db.refresh(proj)

        # Default Datasets
        existing_datasets = db.query(DatasetModel).filter(DatasetModel.workspace_id == ws.id).all()
        if not existing_datasets:
            ds_configs = [
                {
                    "name": "MNIST (Digits 0-9)",
                    "dataset_type": "mnist",
                    "num_samples": 2000,
                    "input_shape_json": "[1, 28, 28]",
                    "num_classes": 10,
                    "schema_json": json.dumps({"task": "classification", "channels": 1, "height": 28, "width": 28}),
                },
                {
                    "name": "Synthetic Moons (Non-Linear)",
                    "dataset_type": "synthetic_moons",
                    "num_samples": 1000,
                    "input_shape_json": "[2]",
                    "num_classes": 2,
                    "schema_json": json.dumps({"task": "classification", "features": 2, "classes": 2}),
                },
                {
                    "name": "Iris Tabular Dataset",
                    "dataset_type": "iris",
                    "num_samples": 150,
                    "input_shape_json": "[4]",
                    "num_classes": 3,
                    "schema_json": json.dumps({"task": "classification", "features": 4, "classes": 3}),
                },
                {
                    "name": "Breast Cancer Tabular Diagnostic",
                    "dataset_type": "breast_cancer",
                    "num_samples": 569,
                    "input_shape_json": "[30]",
                    "num_classes": 2,
                    "schema_json": json.dumps({"task": "classification", "features": 30, "classes": 2}),
                },
            ]
            for d in ds_configs:
                db_d = DatasetModel(
                    workspace_id=ws.id,
                    name=d["name"],
                    dataset_type=d["dataset_type"],
                    num_samples=d["num_samples"],
                    input_shape_json=d["input_shape_json"],
                    num_classes=d["num_classes"],
                    schema_json=d["schema_json"],
                )
                db.add(db_d)
            db.commit()

        # Default Starter Architectures
        existing_archs = db.query(Architecture).filter(Architecture.project_id == proj.id).all()
        if not existing_archs:
            # 1. MNIST LeNet-Style CNN
            mnist_graph = ArchitectureGraph(
                id="arch-mnist-cnn",
                name="MNIST Visual ConvNet",
                task="classification",
                input_shape=[1, 28, 28],
                num_classes=10,
                nodes=[
                    ArchitectureNode(id="n-in", type="Input", parameters={"shape": [1, 28, 28]}, position={"x": 50, "y": 200}),
                    ArchitectureNode(id="n-c1", type="Conv2d", parameters={"out_channels": 16, "kernel_size": 3, "padding": 1}, position={"x": 250, "y": 200}),
                    ArchitectureNode(id="n-r1", type="ReLU", position={"x": 420, "y": 200}),
                    ArchitectureNode(id="n-p1", type="MaxPool2d", parameters={"kernel_size": 2, "stride": 2}, position={"x": 560, "y": 200}),
                    ArchitectureNode(id="n-c2", type="Conv2d", parameters={"out_channels": 32, "kernel_size": 3, "padding": 1}, position={"x": 720, "y": 200}),
                    ArchitectureNode(id="n-r2", type="ReLU", position={"x": 890, "y": 200}),
                    ArchitectureNode(id="n-p2", type="MaxPool2d", parameters={"kernel_size": 2, "stride": 2}, position={"x": 1030, "y": 200}),
                    ArchitectureNode(id="n-fl", type="Flatten", position={"x": 1190, "y": 200}),
                    ArchitectureNode(id="n-fc1", type="Linear", parameters={"out_features": 64}, position={"x": 1330, "y": 200}),
                    ArchitectureNode(id="n-r3", type="ReLU", position={"x": 1490, "y": 200}),
                    ArchitectureNode(id="n-fc2", type="Linear", parameters={"out_features": 10}, position={"x": 1630, "y": 200}),
                ],
                edges=[
                    ArchitectureEdge(id="e1", source="n-in", target="n-c1"),
                    ArchitectureEdge(id="e2", source="n-c1", target="n-r1"),
                    ArchitectureEdge(id="e3", source="n-r1", target="n-p1"),
                    ArchitectureEdge(id="e4", source="n-p1", target="n-c2"),
                    ArchitectureEdge(id="e5", source="n-c2", target="n-r2"),
                    ArchitectureEdge(id="e6", source="n-r2", target="n-p2"),
                    ArchitectureEdge(id="e7", source="n-p2", target="n-fl"),
                    ArchitectureEdge(id="e8", source="n-fl", target="n-fc1"),
                    ArchitectureEdge(id="e9", source="n-fc1", target="n-r3"),
                    ArchitectureEdge(id="e10", source="n-r3", target="n-fc2"),
                ],
            )
            v_mnist = ArchitectureValidator.validate_graph(mnist_graph)
            db.add(
                Architecture(
                    project_id=proj.id,
                    name=mnist_graph.name,
                    version="1.0.0",
                    description="2-stage convolutional network with max pooling and dense classification head for digit recognition.",
                    task="classification",
                    input_shape_json=json.dumps(mnist_graph.input_shape),
                    num_classes=mnist_graph.num_classes,
                    graph_json=mnist_graph.model_dump_json(),
                    total_params=v_mnist.total_parameters,
                    trainable_params=v_mnist.trainable_parameters,
                    is_valid=v_mnist.is_valid,
                    created_by=admin.id,
                )
            )

            # 2. Iris MLP Classifier
            iris_graph = ArchitectureGraph(
                id="arch-iris-mlp",
                name="Iris MLP Classifier",
                task="classification",
                input_shape=[4],
                num_classes=3,
                nodes=[
                    ArchitectureNode(id="in-mlp", type="Input", parameters={"shape": [4]}, position={"x": 100, "y": 200}),
                    ArchitectureNode(id="fc1-mlp", type="Linear", parameters={"out_features": 32}, position={"x": 300, "y": 200}),
                    ArchitectureNode(id="relu1-mlp", type="ReLU", position={"x": 480, "y": 200}),
                    ArchitectureNode(id="drop1-mlp", type="Dropout", parameters={"p": 0.2}, position={"x": 620, "y": 200}),
                    ArchitectureNode(id="fc2-mlp", type="Linear", parameters={"out_features": 16}, position={"x": 780, "y": 200}),
                    ArchitectureNode(id="relu2-mlp", type="ReLU", position={"x": 940, "y": 200}),
                    ArchitectureNode(id="fc3-mlp", type="Linear", parameters={"out_features": 3}, position={"x": 1080, "y": 200}),
                ],
                edges=[
                    ArchitectureEdge(id="me1", source="in-mlp", target="fc1-mlp"),
                    ArchitectureEdge(id="me2", source="fc1-mlp", target="relu1-mlp"),
                    ArchitectureEdge(id="me3", source="relu1-mlp", target="drop1-mlp"),
                    ArchitectureEdge(id="me4", source="drop1-mlp", target="fc2-mlp"),
                    ArchitectureEdge(id="me5", source="fc2-mlp", target="relu2-mlp"),
                    ArchitectureEdge(id="me6", source="relu2-mlp", target="fc3-mlp"),
                ],
            )
            v_iris = ArchitectureValidator.validate_graph(iris_graph)
            db.add(
                Architecture(
                    project_id=proj.id,
                    name=iris_graph.name,
                    version="1.0.0",
                    description="Multi-layer perceptron with dropout regularization for 3-class tabular classification.",
                    task="classification",
                    input_shape_json=json.dumps(iris_graph.input_shape),
                    num_classes=iris_graph.num_classes,
                    graph_json=iris_graph.model_dump_json(),
                    total_params=v_iris.total_parameters,
                    trainable_params=v_iris.trainable_parameters,
                    is_valid=v_iris.is_valid,
                    created_by=admin.id,
                )
            )

            db.commit()

    finally:
        db.close()
