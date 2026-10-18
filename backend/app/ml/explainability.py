import torch
import torch.nn as nn
import numpy as np
from typing import Dict, Any, List, Optional
from sklearn.metrics import confusion_matrix, precision_recall_fscore_support


class ModelExplainability:
    """
    Model Explainability and Diagnostics Engine:
    - Confusion matrices & per-class precision, recall, F1
    - Saliency maps (input pixel gradient attribution)
    - Permutation feature importance for tabular inputs
    - Diagnostic metrics with clear distinction between observed measurements and heuristics
    """

    @classmethod
    def evaluate_model_performance(
        cls, model: nn.Module, test_loader: Any, is_classification: bool = True, class_names: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Evaluates model on held-out test data and computes confusion matrix and classification metrics.
        """
        model.eval()
        all_preds = []
        all_targets = []
        all_probs = []

        with torch.no_grad():
            for x_batch, y_batch in test_loader:
                outputs = model(x_batch)
                if is_classification:
                    probs = torch.softmax(outputs, dim=-1)
                    preds = torch.argmax(probs, dim=-1)
                    all_probs.extend(probs.cpu().numpy().tolist())
                    all_preds.extend(preds.cpu().numpy().tolist())
                    all_targets.extend(y_batch.cpu().numpy().tolist())
                else:
                    all_preds.extend(outputs.cpu().numpy().flatten().tolist())
                    all_targets.extend(y_batch.cpu().numpy().flatten().tolist())

        if not is_classification:
            # Regression metrics
            preds_arr = np.array(all_preds)
            targs_arr = np.array(all_targets)
            mse = float(np.mean((preds_arr - targs_arr) ** 2))
            mae = float(np.mean(np.abs(preds_arr - targs_arr)))
            return {
                "task": "regression",
                "mse": mse,
                "mae": mae,
                "rmse": float(np.sqrt(mse)),
                "num_samples": len(all_preds),
            }

        # Classification metrics
        targets_arr = np.array(all_targets)
        preds_arr = np.array(all_preds)
        unique_classes = np.unique(np.concatenate([targets_arr, preds_arr]))
        n_classes = len(unique_classes)

        cm = confusion_matrix(targets_arr, preds_arr, labels=unique_classes)
        acc = float(np.mean(preds_arr == targets_arr))

        precision, recall, f1, support = precision_recall_fscore_support(
            targets_arr, preds_arr, labels=unique_classes, zero_division=0
        )

        labels = class_names if class_names and len(class_names) == n_classes else [str(c) for c in unique_classes]

        class_metrics = []
        for i, lbl in enumerate(labels):
            class_metrics.append({
                "class_name": lbl,
                "precision": float(precision[i]),
                "recall": float(recall[i]),
                "f1_score": float(f1[i]),
                "support": int(support[i]),
            })

        return {
            "task": "classification",
            "accuracy": acc,
            "confusion_matrix": {
                "matrix": cm.tolist(),
                "labels": labels,
            },
            "class_metrics": class_metrics,
            "total_test_samples": len(all_targets),
        }

    @classmethod
    def compute_image_saliency(cls, model: nn.Module, image_tensor: torch.Tensor, target_class: Optional[int] = None) -> Dict[str, Any]:
        """
        Computes gradient-based input attribution (Vanilla Saliency map)
        for an image (e.g. drawn MNIST digit).
        Gradient = d(Score_class) / d(Input_pixels)
        """
        model.eval()
        # Input tensor shape: (1, 1, 28, 28) or (1, 28, 28)
        if image_tensor.dim() == 3:
            inp = image_tensor.unsqueeze(0).clone().detach()
        elif image_tensor.dim() == 2:
            inp = image_tensor.unsqueeze(0).unsqueeze(0).clone().detach()
        else:
            inp = image_tensor.clone().detach()

        inp.requires_grad = True

        outputs = model(inp)
        probs = torch.softmax(outputs, dim=-1)
        pred_class = int(torch.argmax(probs, dim=-1).item())
        confidence = float(probs[0, pred_class].item())

        selected_class = target_class if target_class is not None else pred_class
        score = outputs[0, selected_class]
        score.backward()

        # Absolute value of gradient represents sensitivity of pixel
        grad = inp.grad.data.abs().squeeze().cpu().numpy()
        # Normalize to [0, 1] range for visual heatmaps
        grad_max = np.max(grad)
        if grad_max > 0:
            saliency = grad / grad_max
        else:
            saliency = grad

        return {
            "predicted_class": pred_class,
            "confidence": confidence,
            "all_probabilities": probs.detach().cpu().numpy().flatten().tolist(),
            "saliency_map": saliency.tolist(),
            "attribution_method": "Gradient Saliency (Input Attribution)",
            "interpretation_note": "Observed attribution reflects local gradient sensitivity at the current decision boundary, not a causal guarantee.",
        }

    @classmethod
    def compute_permutation_importance(
        cls, model: nn.Module, x_val: torch.Tensor, y_val: torch.Tensor, feature_names: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Computes permutation feature importance for tabular inputs.
        Measures drop in accuracy when each feature column is randomly shuffled.
        """
        model.eval()
        with torch.no_grad():
            base_out = model(x_val)
            base_acc = float((torch.argmax(base_out, dim=-1) == y_val).float().mean().item())

        importances = []
        x_numpy = x_val.cpu().numpy()

        for col_idx in range(x_numpy.shape[1]):
            x_shuffled = x_numpy.copy()
            np.random.shuffle(x_shuffled[:, col_idx])
            t_shuffled = torch.tensor(x_shuffled, dtype=torch.float32)

            with torch.no_grad():
                shuffled_out = model(t_shuffled)
                shuffled_acc = float((torch.argmax(shuffled_out, dim=-1) == y_val).float().mean().item())

            drop = max(0.0, base_acc - shuffled_acc)
            feat_name = feature_names[col_idx] if col_idx < len(feature_names) else f"Feature {col_idx}"
            importances.append({
                "feature": feat_name,
                "importance_score": float(drop),
                "baseline_accuracy": base_acc,
                "shuffled_accuracy": shuffled_acc,
            })

        importances.sort(key=lambda x: x["importance_score"], reverse=True)
        return importances
