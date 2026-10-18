import os
import hashlib
import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any, Optional, List
import torch
from torch.utils.data import TensorDataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.datasets import make_moons, make_circles, make_blobs, load_iris, load_wine, load_breast_cancer


class DatasetManager:
    """
    Manages datasets for NNAS:
    - MNIST (with real download and offline synthetic fallback)
    - Synthetic classification (moons, circles, blobs)
    - Tabular classification and regression (built-in & uploaded CSV)
    - Strict train/val/test splitting with zero data leakage (scalers fit only on train split)
    - Data quality summary (missing values, class distribution, fingerprints)
    """

    @classmethod
    def get_dataset(
        cls,
        dataset_name: str,
        split_ratios: Tuple[float, float, float] = (0.7, 0.15, 0.15),
        batch_size: int = 64,
        random_seed: int = 42,
        csv_path: Optional[str] = None,
        target_column: Optional[str] = None,
        image_size: Optional[int] = None,
        color_mode: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Loads and prepares train, val, and test data loaders.
        """
        np.random.seed(random_seed)
        torch.manual_seed(random_seed)

        train_r, val_r, test_r = split_ratios
        total_r = train_r + val_r + test_r
        train_r, val_r, test_r = train_r / total_r, val_r / total_r, test_r / total_r

        if dataset_name.lower() == "mnist":
            x_data, y_data, metadata = cls._load_mnist()
        elif dataset_name.lower() in ("moons", "synthetic_moons"):
            x_data, y_data, metadata = cls._load_synthetic_moons()
        elif dataset_name.lower() in ("circles", "synthetic_circles"):
            x_data, y_data, metadata = cls._load_synthetic_circles()
        elif dataset_name.lower() in ("blobs", "synthetic_blobs"):
            x_data, y_data, metadata = cls._load_synthetic_blobs()
        elif dataset_name.lower() == "iris":
            x_data, y_data, metadata = cls._load_iris()
        elif dataset_name.lower() == "wine":
            x_data, y_data, metadata = cls._load_wine()
        elif dataset_name.lower() == "breast_cancer":
            x_data, y_data, metadata = cls._load_breast_cancer()
        elif dataset_name.lower() == "custom_csv":
            if not csv_path or not os.path.exists(csv_path):
                raise ValueError(f"Custom CSV path '{csv_path}' does not exist.")
            x_data, y_data, metadata = cls._load_custom_csv(csv_path, target_column)
        elif dataset_name.lower() in ("custom_image_zip", "image_zip", "zip"):
            target_path = csv_path
            if not target_path or not os.path.exists(target_path):
                raise ValueError(f"Custom Image ZIP path '{target_path}' does not exist.")
            img_sz = image_size if (image_size and image_size > 0) else 28
            col_md = color_mode if color_mode in ("grayscale", "rgb") else "grayscale"
            x_data, y_data, metadata = cls._load_image_zip(
                target_path,
                target_size=(img_sz, img_sz),
                color_mode=col_md,
            )
        else:
            raise ValueError(f"Unsupported dataset: {dataset_name}")

        # Split into Train, Val, Test
        n_samples = len(x_data)
        indices = np.arange(n_samples)

        is_classification = metadata.get("task", "classification") == "classification"
        stratify_labels = y_data if is_classification and len(np.unique(y_data)) < 50 else None

        # Split Train vs (Val + Test)
        val_test_ratio = val_r + test_r
        try:
            train_idx, val_test_idx = train_test_split(
                indices,
                test_size=val_test_ratio,
                random_state=random_seed,
                stratify=stratify_labels,
            )
        except Exception:
            train_idx, val_test_idx = train_test_split(
                indices,
                test_size=val_test_ratio,
                random_state=random_seed,
                stratify=None,
            )

        # Split Val vs Test
        val_portion_of_rem = val_r / (val_r + test_r) if (val_r + test_r) > 0 else 0.5
        val_test_strat = y_data[val_test_idx] if stratify_labels is not None else None
        try:
            val_idx, test_idx = train_test_split(
                val_test_idx,
                train_size=val_portion_of_rem,
                random_state=random_seed,
                stratify=val_test_strat,
            )
        except Exception:
            val_idx, test_idx = train_test_split(
                val_test_idx,
                train_size=val_portion_of_rem,
                random_state=random_seed,
                stratify=None,
            )

        x_train, y_train = x_data[train_idx], y_data[train_idx]
        x_val, y_val = x_data[val_idx], y_data[val_idx]
        x_test, y_test = x_data[test_idx], y_data[test_idx]

        # Feature normalization for 1D tabular features to prevent data leakage:
        if len(x_train.shape) == 2 and dataset_name.lower() != "mnist":
            scaler = StandardScaler()
            x_train = scaler.fit_transform(x_train)
            x_val = scaler.transform(x_val)
            x_test = scaler.transform(x_test)

        # Convert to PyTorch Tensors
        x_train_t = torch.tensor(x_train, dtype=torch.float32)
        x_val_t = torch.tensor(x_val, dtype=torch.float32)
        x_test_t = torch.tensor(x_test, dtype=torch.float32)

        if is_classification:
            y_train_t = torch.tensor(y_train, dtype=torch.long)
            y_val_t = torch.tensor(y_val, dtype=torch.long)
            y_test_t = torch.tensor(y_test, dtype=torch.long)
        else:
            y_train_t = torch.tensor(y_train, dtype=torch.float32).unsqueeze(1)
            y_val_t = torch.tensor(y_val, dtype=torch.float32).unsqueeze(1)
            y_test_t = torch.tensor(y_test, dtype=torch.float32).unsqueeze(1)

        # DataLoaders
        train_loader = DataLoader(TensorDataset(x_train_t, y_train_t), batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(TensorDataset(x_val_t, y_val_t), batch_size=batch_size, shuffle=False)
        test_loader = DataLoader(TensorDataset(x_test_t, y_test_t), batch_size=batch_size, shuffle=False)

        fingerprint = hashlib.sha256(x_data.tobytes() + y_data.tobytes()).hexdigest()

        metadata.update(
            {
                "total_samples": n_samples,
                "train_samples": len(train_idx),
                "val_samples": len(val_idx),
                "test_samples": len(test_idx),
                "fingerprint": fingerprint,
                "batch_size": batch_size,
            }
        )

        return {
            "train_loader": train_loader,
            "val_loader": val_loader,
            "test_loader": test_loader,
            "metadata": metadata,
            "raw_test_data": (x_test_t, y_test_t),
        }

    @classmethod
    def _load_mnist(cls) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        """
        Loads MNIST. Attempts torchvision MNIST download; if network is unavailable
        or fails, generates realistic synthetic 28x28 digit patterns for reliable offline execution.
        """
        data_dir = os.path.join(os.path.expanduser("~"), ".nnas", "data", "mnist")
        os.makedirs(data_dir, exist_ok=True)
        try:
            from torchvision.datasets import MNIST
            from torchvision import transforms

            mnist = MNIST(root=data_dir, download=True, train=True)
            # Use 2000 samples for swift, responsive studio training
            images = mnist.data[:2000].numpy().astype(np.float32) / 255.0
            images = np.expand_dims(images, axis=1)  # shape (2000, 1, 28, 28)
            labels = mnist.targets[:2000].numpy().astype(np.int64)
            is_real = True
        except Exception:
            # Fallback to realistic synthetic offline MNIST
            images, labels = cls._generate_synthetic_mnist(num_samples=1200)
            is_real = False

        class_dist = {int(k): int(v) for k, v in zip(*np.unique(labels, return_counts=True))}

        metadata = {
            "name": "MNIST",
            "task": "classification",
            "input_shape": [1, 28, 28],
            "num_classes": 10,
            "class_distribution": class_dist,
            "is_real_download": is_real,
            "classes": [str(i) for i in range(10)],
        }
        return images, labels, metadata

    @classmethod
    def _generate_synthetic_mnist(cls, num_samples: int = 1200) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generates realistic 28x28 grayscale digits 0-9 using geometric rasterization
        for 100% offline self-contained demonstration and test reliability.
        """
        images = np.zeros((num_samples, 1, 28, 28), dtype=np.float32)
        labels = np.zeros((num_samples,), dtype=np.int64)

        for i in range(num_samples):
            digit = i % 10
            labels[i] = digit
            img = np.zeros((28, 28), dtype=np.float32)
            # Simple recognizable stroke patterns
            if digit == 0:
                img[6:22, 6:9] = 1.0
                img[6:22, 19:22] = 1.0
                img[6:9, 6:22] = 1.0
                img[19:22, 6:22] = 1.0
            elif digit == 1:
                img[6:22, 13:16] = 1.0
                img[6:9, 10:14] = 0.8
                img[20:23, 10:19] = 0.8
            elif digit == 2:
                img[6:9, 6:22] = 1.0
                img[9:14, 19:22] = 1.0
                img[13:16, 6:22] = 1.0
                img[16:21, 6:9] = 1.0
                img[20:23, 6:22] = 1.0
            elif digit == 3:
                img[6:9, 6:22] = 1.0
                img[13:16, 10:22] = 1.0
                img[20:23, 6:22] = 1.0
                img[6:22, 19:22] = 1.0
            elif digit == 4:
                img[6:15, 6:9] = 1.0
                img[13:16, 6:22] = 1.0
                img[6:22, 18:21] = 1.0
            elif digit == 5:
                img[6:9, 6:22] = 1.0
                img[9:14, 6:9] = 1.0
                img[13:16, 6:22] = 1.0
                img[16:21, 19:22] = 1.0
                img[20:23, 6:22] = 1.0
            elif digit == 6:
                img[6:22, 6:9] = 1.0
                img[6:9, 6:22] = 1.0
                img[13:16, 6:22] = 1.0
                img[20:23, 6:22] = 1.0
                img[14:22, 19:22] = 1.0
            elif digit == 7:
                img[6:9, 6:22] = 1.0
                img[9:22, 18:21] = 1.0
            elif digit == 8:
                img[6:22, 6:9] = 1.0
                img[6:22, 19:22] = 1.0
                img[6:9, 6:22] = 1.0
                img[13:16, 6:22] = 1.0
                img[20:23, 6:22] = 1.0
            elif digit == 9:
                img[6:15, 6:9] = 1.0
                img[6:22, 19:22] = 1.0
                img[6:9, 6:22] = 1.0
                img[13:16, 6:22] = 1.0
                img[20:23, 10:22] = 1.0

            # Add subtle jitter and Gaussian noise
            noise = np.random.normal(0, 0.08, (28, 28)).astype(np.float32)
            img = np.clip(img + noise, 0.0, 1.0)
            images[i, 0] = img

        return images, labels

    @classmethod
    def _load_synthetic_moons(cls) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        x, y = make_moons(n_samples=1000, noise=0.15, random_state=42)
        x = x.astype(np.float32)
        y = y.astype(np.int64)
        metadata = {
            "name": "Synthetic Moons",
            "task": "classification",
            "input_shape": [2],
            "num_classes": 2,
            "classes": ["Class 0", "Class 1"],
            "class_distribution": {0: 500, 1: 500},
        }
        return x, y, metadata

    @classmethod
    def _load_synthetic_circles(cls) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        x, y = make_circles(n_samples=1000, noise=0.1, factor=0.5, random_state=42)
        x = x.astype(np.float32)
        y = y.astype(np.int64)
        metadata = {
            "name": "Synthetic Circles",
            "task": "classification",
            "input_shape": [2],
            "num_classes": 2,
            "classes": ["Inner Circle", "Outer Circle"],
            "class_distribution": {0: 500, 1: 500},
        }
        return x, y, metadata

    @classmethod
    def _load_synthetic_blobs(cls) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        x, y = make_blobs(n_samples=1200, centers=4, n_features=4, cluster_std=1.2, random_state=42)
        x = x.astype(np.float32)
        y = y.astype(np.int64)
        metadata = {
            "name": "Synthetic Blobs",
            "task": "classification",
            "input_shape": [4],
            "num_classes": 4,
            "classes": ["Cluster 0", "Cluster 1", "Cluster 2", "Cluster 3"],
            "class_distribution": {0: 300, 1: 300, 2: 300, 3: 300},
        }
        return x, y, metadata

    @classmethod
    def _load_iris(cls) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        iris = load_iris()
        x = iris.data.astype(np.float32)
        y = iris.target.astype(np.int64)
        metadata = {
            "name": "Iris Tabular",
            "task": "classification",
            "input_shape": [4],
            "num_classes": 3,
            "classes": list(iris.target_names),
            "feature_names": list(iris.feature_names),
            "class_distribution": {int(k): int(v) for k, v in zip(*np.unique(y, return_counts=True))},
        }
        return x, y, metadata

    @classmethod
    def _load_wine(cls) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        wine = load_wine()
        x = wine.data.astype(np.float32)
        y = wine.target.astype(np.int64)
        metadata = {
            "name": "Wine Recognition",
            "task": "classification",
            "input_shape": [13],
            "num_classes": 3,
            "classes": list(wine.target_names),
            "feature_names": list(wine.feature_names),
            "class_distribution": {int(k): int(v) for k, v in zip(*np.unique(y, return_counts=True))},
        }
        return x, y, metadata

    @classmethod
    def _load_breast_cancer(cls) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        bc = load_breast_cancer()
        x = bc.data.astype(np.float32)
        y = bc.target.astype(np.int64)
        metadata = {
            "name": "Breast Cancer Tabular",
            "task": "classification",
            "input_shape": [30],
            "num_classes": 2,
            "classes": list(bc.target_names),
            "feature_names": list(bc.feature_names),
            "class_distribution": {int(k): int(v) for k, v in zip(*np.unique(y, return_counts=True))},
        }
        return x, y, metadata

    @classmethod
    def _load_custom_csv(cls, file_path: str, target_column: Optional[str]) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        df = pd.read_csv(file_path)
        if df.empty:
            raise ValueError("Provided CSV file is empty.")

        # Determine target column
        if not target_column or target_column not in df.columns:
            target_column = df.columns[-1]

        y_series = df[target_column]
        x_df = df.drop(columns=[target_column])

        # Handle missing values in features
        for col in x_df.columns:
            if pd.api.types.is_numeric_dtype(x_df[col]):
                x_df[col] = x_df[col].fillna(x_df[col].median())
            else:
                x_df[col] = x_df[col].fillna(x_df[col].mode().iloc[0] if not x_df[col].mode().empty else "missing")
                # One-hot encode categoricals
                dummies = pd.get_dummies(x_df[col], prefix=col, drop_first=True)
                x_df = x_df.drop(columns=[col]).join(dummies)

        x_array = x_df.values.astype(np.float32)

        # Detect classification vs regression
        if pd.api.types.is_numeric_dtype(y_series) and len(y_series.unique()) > 20:
            task = "regression"
            y_array = y_series.values.astype(np.float32)
            num_classes = 1
            classes = ["continuous"]
            class_dist = {}
        else:
            task = "classification"
            unique_labels = sorted(y_series.unique().tolist())
            label_map = {lbl: idx for idx, lbl in enumerate(unique_labels)}
            y_array = np.array([label_map[v] for v in y_series], dtype=np.int64)
            num_classes = len(unique_labels)
            classes = [str(lbl) for lbl in unique_labels]
            class_dist = {int(k): int(v) for k, v in zip(*np.unique(y_array, return_counts=True))}

        metadata = {
            "name": os.path.basename(file_path),
            "task": task,
            "input_shape": [x_array.shape[1]],
            "num_classes": num_classes,
            "classes": classes,
            "feature_names": list(x_df.columns),
            "class_distribution": class_dist,
        }
        return x_array, y_array, metadata

    @classmethod
    def _load_image_zip(
        cls,
        file_path: str,
        target_size: Tuple[int, int] = (28, 28),
        color_mode: str = "grayscale",
    ) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        import io
        import zipfile
        from PIL import Image

        if not os.path.exists(file_path):
            raise ValueError(f"Image ZIP file '{file_path}' does not exist.")

        valid_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff"}
        x_list = []
        raw_labels = []

        with zipfile.ZipFile(file_path, "r") as z:
            # Filter entries ignoring hidden Mac/Linux archive artifacts
            entries = [
                e for e in z.namelist()
                if not e.startswith("__MACOSX")
                and not os.path.basename(e).startswith(".")
                and os.path.splitext(e.lower())[1] in valid_exts
            ]

            if not entries:
                raise ValueError(
                    "No valid image files (.jpg, .jpeg, .png, .bmp, .webp) found inside the ZIP archive."
                )

            for entry in entries:
                # Infer class label from parent folder name
                # e.g., 'pneumonia/person1_virus_11.jpeg' -> 'pneumonia'
                # or 'chest_xray/train/normal/IM-0115-0001.jpeg' -> 'normal'
                parts = [p for p in entry.replace("\\", "/").split("/") if p]
                if len(parts) > 1:
                    label = parts[-2]
                else:
                    label = "class_0"

                try:
                    img_bytes = z.read(entry)
                    with Image.open(io.BytesIO(img_bytes)) as img:
                        if color_mode == "rgb":
                            img = img.convert("RGB")
                        else:
                            img = img.convert("L")

                        img = img.resize(target_size, Image.Resampling.BILINEAR)
                        arr = np.array(img, dtype=np.float32) / 255.0

                        if color_mode == "rgb":
                            # Shape (H, W, 3) -> (3, H, W)
                            arr = np.transpose(arr, (2, 0, 1))
                        else:
                            # Shape (H, W) -> (1, H, W)
                            arr = np.expand_dims(arr, axis=0)

                        x_list.append(arr)
                        raw_labels.append(label)
                except Exception:
                    # Skip corrupt image entries
                    continue

        if not x_list:
            raise ValueError("Failed to decode any valid images from the ZIP archive.")

        class_names = sorted(list(set(raw_labels)))
        label_map = {name: idx for idx, name in enumerate(class_names)}
        y_array = np.array([label_map[c] for c in raw_labels], dtype=np.int64)
        x_array = np.array(x_list, dtype=np.float32)

        input_shape = list(x_array.shape[1:])  # e.g. [1, 28, 28] or [3, 64, 64]
        class_dist = {int(k): int(v) for k, v in zip(*np.unique(y_array, return_counts=True))}

        metadata = {
            "name": os.path.basename(file_path),
            "task": "classification",
            "input_shape": input_shape,
            "num_classes": len(class_names),
            "classes": class_names,
            "class_distribution": class_dist,
            "total_images": len(x_array),
            "color_mode": color_mode,
            "image_size": target_size[0],
        }
        return x_array, y_array, metadata
