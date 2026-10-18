import time
import os
import torch
import torch.nn as nn
from typing import Dict, Any, Callable, Optional, List
from app.ml.compiler import CompiledNetwork
from app.ml.explainability import ModelExplainability


class TrainingJobExecutor:
    """
    Executes real PyTorch neural network training with:
    - Real-time epoch metric emission
    - Early stopping
    - Checkpoint persistence
    - Controlled cancellation and pause flags
    - Post-training evaluation on held-out test data
    """

    @classmethod
    def train(
        cls,
        model: CompiledNetwork,
        train_loader: Any,
        val_loader: Any,
        test_loader: Any,
        training_config: Dict[str, Any],
        checkpoint_dir: str,
        is_classification: bool = True,
        class_names: Optional[List[str]] = None,
        progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None,
        cancellation_check: Optional[Callable[[], bool]] = None,
        pause_check: Optional[Callable[[], bool]] = None,
    ) -> Dict[str, Any]:
        epochs = int(training_config.get("epochs", 10))
        lr = float(training_config.get("learning_rate", 0.001))
        weight_decay = float(training_config.get("weight_decay", 1e-4))
        opt_name = str(training_config.get("optimizer", "adam")).lower()
        loss_name = str(training_config.get("loss", "cross_entropy")).lower()
        early_stopping_patience = int(training_config.get("early_stopping_patience", 5))

        # Setup Optimizer
        if opt_name == "sgd":
            optimizer = torch.optim.SGD(model.parameters(), lr=lr, weight_decay=weight_decay, momentum=0.9)
        elif opt_name == "adamw":
            optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)
        elif opt_name == "rmsprop":
            optimizer = torch.optim.RMSprop(model.parameters(), lr=lr, weight_decay=weight_decay)
        else:
            optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=weight_decay)

        # Setup Loss Function
        if is_classification:
            criterion = nn.CrossEntropyLoss()
        else:
            if loss_name == "l1":
                criterion = nn.L1Loss()
            else:
                criterion = nn.MSELoss()

        os.makedirs(checkpoint_dir, exist_ok=True)
        best_checkpoint_path = os.path.join(checkpoint_dir, "best_model.pt")

        metrics_history: List[Dict[str, Any]] = []
        logs: List[str] = []

        best_val_loss = float("inf")
        best_epoch = 0
        patience_counter = 0

        start_time = time.time()
        logs.append(f"Training started with {epochs} epochs, optimizer={opt_name.upper()}, lr={lr}")

        status = "SUCCEEDED"

        for epoch in range(1, epochs + 1):
            # Check cancellation
            if cancellation_check and cancellation_check():
                status = "CANCELLED"
                logs.append(f"Training cancelled by user at epoch {epoch}.")
                break

            # Check pause
            while pause_check and pause_check():
                time.sleep(0.5)
                if cancellation_check and cancellation_check():
                    status = "CANCELLED"
                    break
            if status == "CANCELLED":
                break

            epoch_start = time.time()
            model.train()
            total_train_loss = 0.0
            correct_train = 0
            total_train_samples = 0

            for batch_x, batch_y in train_loader:
                optimizer.zero_grad()
                outputs = model(batch_x)

                if is_classification:
                    loss = criterion(outputs, batch_y)
                    preds = torch.argmax(outputs, dim=-1)
                    correct_train += (preds == batch_y).sum().item()
                else:
                    loss = criterion(outputs, batch_y)

                loss.backward()
                optimizer.step()

                total_train_loss += loss.item() * len(batch_y)
                total_train_samples += len(batch_y)

            avg_train_loss = total_train_loss / max(1, total_train_samples)
            train_acc = (correct_train / total_train_samples) if is_classification else None

            # Validation
            model.eval()
            total_val_loss = 0.0
            correct_val = 0
            total_val_samples = 0

            with torch.no_grad():
                for val_x, val_y in val_loader:
                    val_out = model(val_x)
                    val_loss = criterion(val_out, val_y)
                    total_val_loss += val_loss.item() * len(val_y)
                    total_val_samples += len(val_y)
                    if is_classification:
                        v_preds = torch.argmax(val_out, dim=-1)
                        correct_val += (v_preds == val_y).sum().item()

            avg_val_loss = total_val_loss / max(1, total_val_samples)
            val_acc = (correct_val / total_val_samples) if is_classification else None
            epoch_duration = time.time() - epoch_start

            metric_entry = {
                "epoch": epoch,
                "train_loss": round(avg_train_loss, 4),
                "val_loss": round(avg_val_loss, 4),
                "train_acc": round(train_acc, 4) if train_acc is not None else None,
                "val_acc": round(val_acc, 4) if val_acc is not None else None,
                "epoch_time_seconds": round(epoch_duration, 2),
            }
            metrics_history.append(metric_entry)

            acc_str = f" | Train Acc: {train_acc:.2%}, Val Acc: {val_acc:.2%}" if is_classification else ""
            log_line = f"Epoch [{epoch}/{epochs}] - Train Loss: {avg_train_loss:.4f}, Val Loss: {avg_val_loss:.4f}{acc_str} ({epoch_duration:.2f}s)"
            logs.append(log_line)

            # Emit live progress
            if progress_callback:
                progress_callback({
                    "current_epoch": epoch,
                    "total_epochs": epochs,
                    "latest_metrics": metric_entry,
                    "metrics_history": metrics_history,
                    "log_line": log_line,
                })

            # Checkpoint best model
            if avg_val_loss < best_val_loss:
                best_val_loss = avg_val_loss
                best_epoch = epoch
                patience_counter = 0
                torch.save(
                    {
                        "epoch": epoch,
                        "model_state_dict": model.state_dict(),
                        "optimizer_state_dict": optimizer.state_dict(),
                        "val_loss": best_val_loss,
                        "val_acc": val_acc,
                        "architecture_graph": model.graph.model_dump(),
                    },
                    best_checkpoint_path,
                )
            else:
                patience_counter += 1
                if patience_counter >= early_stopping_patience:
                    logs.append(f"Early stopping triggered at epoch {epoch} (no improvement for {early_stopping_patience} epochs).")
                    break

        total_duration = time.time() - start_time

        # Load best weights before final test evaluation
        if os.path.exists(best_checkpoint_path):
            checkpoint = torch.load(best_checkpoint_path, weights_only=False)
            model.load_state_dict(checkpoint["model_state_dict"])
            logs.append(f"Loaded best checkpoint from epoch {best_epoch} with val_loss={best_val_loss:.4f}")

        # Final Evaluation on Held-Out Test Data
        logs.append("Evaluating final model on held-out test dataset...")
        eval_results = ModelExplainability.evaluate_model_performance(
            model=model,
            test_loader=test_loader,
            is_classification=is_classification,
            class_names=class_names,
        )
        if is_classification:
            logs.append(f"Held-out Test Accuracy: {eval_results.get('accuracy', 0.0):.2%}")
        else:
            logs.append(f"Held-out Test MSE: {eval_results.get('mse', 0.0):.4f}")

        return {
            "status": status,
            "total_duration_seconds": round(total_duration, 2),
            "best_epoch": best_epoch,
            "best_val_loss": round(best_val_loss, 4),
            "metrics_history": metrics_history,
            "evaluation": eval_results,
            "checkpoint_path": best_checkpoint_path if os.path.exists(best_checkpoint_path) else None,
            "logs": logs,
        }
