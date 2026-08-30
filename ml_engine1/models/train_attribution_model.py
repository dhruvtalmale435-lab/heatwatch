import sys
import os
import json
import pickle
import numpy as np

# Ensure UTF-8 output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score, accuracy_score
from sklearn.ensemble import RandomForestClassifier

from feature_pipeline import generate_synthetic_training_dataset, FEATURE_NAMES, CATEGORY_LABELS

def train_and_save_model(output_dir: str = "."):
    print("=" * 60)
    print("HEATWATCH BRAIN 1: SOURCE ATTRIBUTION MODEL TRAINING")
    print("=" * 60)

    # 1. Generate / Load dataset
    print("[1/4] Generating / Loading multi-modal training dataset...")
    X_df, y = generate_synthetic_training_dataset(n_samples=3000)
    print(f"      Total records: {len(X_df)} across 6 thermal categories.")

    # 2. Train-Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X_df.values, y, test_size=0.20, random_state=42, stratify=y
    )

    # 3. Model Architecture: Try XGBoost if available, fallback to tuned RandomForest
    print("[2/4] Training ensemble gradient/tree classifier...")
    try:
        import xgboost as xgb
        model = xgb.XGBClassifier(
            n_estimators=250,
            max_depth=5,
            learning_rate=0.06,
            subsample=0.85,
            colsample_bytree=0.85,
            objective="multi:softprob",
            num_class=6,
            random_state=42
        )
        model_type = "XGBoostClassifier"
    except ImportError:
        model = RandomForestClassifier(
            n_estimators=200,
            max_depth=12,
            min_samples_split=4,
            random_state=42
        )
        model_type = "RandomForestClassifier"

    model.fit(X_train, y_train)
    print(f"      Trained successfully using {model_type}.")

    # 4. Evaluation
    print("[3/4] Evaluating multi-class validation benchmark...")
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    f1_macro = f1_score(y_test, y_pred, average="macro")
    f1_weighted = f1_score(y_test, y_pred, average="weighted")

    print(f"      Accuracy:    {acc * 100:.2f}%")
    print(f"      F1 (Macro):   {f1_macro * 100:.2f}%")
    print(f"      F1 (Weighted):{f1_weighted * 100:.2f}%\n")
    print("Detailed Classification Report:")
    target_names = [CATEGORY_LABELS[i] for i in range(6)]
    print(classification_report(y_test, y_pred, target_names=target_names))

    # 5. Extract Feature Importances
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        feature_ranking = sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True)
        print("Top 5 Indicative Features:")
        for feat, imp in feature_ranking[:5]:
            print(f"      - {feat:22s}: {imp * 100:.2f}%")

    # 6. Save Artifacts
    os.makedirs(output_dir, exist_ok=True)
    model_path = os.path.join(output_dir, "attribution_model.pkl")
    meta_path = os.path.join(output_dir, "model_metadata.json")

    with open(model_path, "wb") as f:
        pickle.dump(model, f)

    metadata = {
        "model_type": model_type,
        "n_classes": 6,
        "features": FEATURE_NAMES,
        "accuracy": round(float(acc), 4),
        "f1_score": round(float(f1_weighted), 4),
        "categories": CATEGORY_LABELS
    }
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n[4/4] Saved trained model to: {model_path}")
    print(f"      Saved metadata to: {meta_path}")
    print("=" * 60)
    return model, metadata

if __name__ == "__main__":
    train_and_save_model()
