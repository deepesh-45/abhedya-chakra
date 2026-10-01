"""
PyTorch Deep Learning Graph Neural Network (Model M4).
Implements a 3-layer Inductive GraphSAGE-style Neural Network for Money Mule Ring Detection.
Based on research papers:
- Hamilton et al. (NeurIPS): 'Inductive Representation Learning on Large Graphs'
- Weber et al. (KDD Workshop): 'Anti-Money Laundering with Graph Convolutional Networks'
"""

import time
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple

GNN_MODEL_PATH = Path("ml/models/m4_torch_gnn.pt")

class MuleGNNModel(nn.Module):
    def __init__(self, in_features: int = 12, hidden_dim: int = 64, out_dim: int = 1):
        super(MuleGNNModel, self).__init__()
        # Layer 1: Self features + In-neighbor aggregation + Out-neighbor aggregation
        self.fc1 = nn.Linear(in_features * 3, hidden_dim)
        self.bn1 = nn.BatchNorm1d(hidden_dim)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.2)

        # Layer 2: Deep Representation Layer
        self.fc2 = nn.Linear(hidden_dim, hidden_dim // 2)
        self.bn2 = nn.BatchNorm1d(hidden_dim // 2)

        # Layer 3: Risk Output
        self.fc3 = nn.Linear(hidden_dim // 2, out_dim)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x_concat: torch.Tensor) -> torch.Tensor:
        # x_concat contains [h_v, AGG_in(h_u), AGG_out(h_w)]
        h = self.fc1(x_concat)
        h = self.bn1(h)
        h = self.relu(h)
        h = self.dropout(h)

        h = self.fc2(h)
        h = self.bn2(h)
        h = self.relu(h)
        h = self.dropout(h)

        out = self.fc3(h)
        return self.sigmoid(out)

class PyTorchMuleDetector:
    def __init__(self):
        self.device = torch.device("cpu")
        self.model = MuleGNNModel()

    def train_gnn(
        self,
        X_gnn: np.ndarray,
        y: np.ndarray,
        train_mask: np.ndarray,
        epochs: int = 40,
        lr: float = 0.005
    ) -> Dict[str, Any]:
        """
        Train the PyTorch GNN on the aggregated graph representation matrix.
        """
        t0 = time.perf_counter()

        self.model.to(self.device)
        self.model.train()

        # Balance positive and negative weights (Focal / Weighted BCE)
        pos_weight_val = float(np.sum(y[train_mask] == 0)) / max(1.0, float(np.sum(y[train_mask] == 1)))
        pos_weight = torch.tensor([pos_weight_val], device=self.device)
        criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
        optimizer = optim.AdamW(self.model.parameters(), lr=lr, weight_decay=1e-4)

        X_t = torch.tensor(X_gnn, dtype=torch.float32, device=self.device)
        y_t = torch.tensor(y, dtype=torch.float32, device=self.device).unsqueeze(1)
        mask_t = torch.tensor(train_mask, dtype=torch.bool, device=self.device)

        X_train = X_t[mask_t]
        y_train = y_t[mask_t]

        final_loss = 0.0
        for epoch in range(epochs):
            optimizer.zero_grad()
            logits = self.model.fc3(
                self.model.dropout(
                    self.model.relu(
                        self.model.bn2(
                            self.model.fc2(
                                self.model.dropout(
                                    self.model.relu(
                                        self.model.bn1(
                                            self.model.fc1(X_train)
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            )
            loss = criterion(logits, y_train)
            loss.backward()
            optimizer.step()
            final_loss = float(loss.item())

        # Inference across all accounts
        self.model.eval()
        with torch.no_grad():
            preds = self.model(X_t).squeeze().cpu().numpy()

        # Save model checkpoint
        GNN_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        torch.save(self.model.state_dict(), str(GNN_MODEL_PATH))

        elapsed = time.perf_counter() - t0
        return {
            "elapsed_seconds": round(elapsed, 2),
            "final_loss": round(final_loss, 4),
            "probabilities": preds,
            "model_path": str(GNN_MODEL_PATH)
        }

pytorch_mule_detector = PyTorchMuleDetector()
