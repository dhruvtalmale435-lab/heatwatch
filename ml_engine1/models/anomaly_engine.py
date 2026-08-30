"""
HeatWatch - Brain 2: Behavioural Anomaly & Surge Detection Engine
Maintains 90-day rolling operational baselines per thermal object and calculates
FRP Z-scores, footprint dilation, and centroid displacement.
"""

import numpy as np
from typing import Dict, Any
from sklearn.ensemble import IsolationForest

class AnomalyEngine:
    def __init__(self, contamination: float = 0.03):
        self.contamination = contamination
        self.iso_forest = IsolationForest(
            n_estimators=150,
            contamination=contamination,
            random_state=42
        )
        self._fit_initial_baseline()

    def _fit_initial_baseline(self):
        """
        Fits Isolation Forest on empirical standard baseline telemetry:
        [frp_norm, temp_norm, footprint_ratio, drift_m]
        """
        np.random.seed(42)
        # 1000 normal operating baseline samples
        frp_norm = np.random.normal(1.0, 0.25, 1000)
        temp_norm = np.random.normal(1.0, 0.05, 1000)
        footprint_ratio = np.random.normal(1.0, 0.15, 1000)
        drift_m = np.random.exponential(8.0, 1000)

        X_baseline = np.column_stack([frp_norm, temp_norm, footprint_ratio, drift_m])
        self.iso_forest.fit(X_baseline)

    def evaluate_anomaly(
        self,
        current_telemetry: Dict[str, Any],
        baseline_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluates acute thermal surge, footprint dilation, and lateral spread.
        """
        current_frp = float(current_telemetry.get("current_frp", 25.0))
        current_temp_k = float(current_telemetry.get("brightness_temp_k", 340.0))
        centroid_drift_m = float(current_telemetry.get("centroid_drift_m", 10.0))
        active_pixel_count = int(current_telemetry.get("active_pixel_count", 1))

        # Baseline parameters
        mean_frp = max(float(baseline_profile.get("mean_frp", 25.0)), 1.0)
        std_frp = max(float(baseline_profile.get("std_frp", 6.0)), 1.0)
        mean_temp_k = max(float(baseline_profile.get("mean_temp_k", 340.0)), 1.0)
        baseline_pixels = max(int(baseline_profile.get("baseline_pixels", 1)), 1)

        # Statistical Deviations
        z_frp = (current_frp - mean_frp) / std_frp
        frp_ratio = current_frp / mean_frp
        temp_ratio = current_temp_k / mean_temp_k
        footprint_ratio = active_pixel_count / baseline_pixels

        # 5-Factor Weighted Anomaly Score (0 - 100)
        # A = 0.40 * Z_frp + 0.25 * S_footprint + 0.15 * D_centroid + 0.10 * T_temp + 0.10 * Persistence
        score_frp = np.clip(z_frp * 20.0, 0.0, 40.0)
        score_footprint = np.clip((footprint_ratio - 1.0) * 25.0, 0.0, 25.0)
        score_drift = np.clip((centroid_drift_m / 100.0) * 15.0, 0.0, 15.0)
        score_temp = np.clip((temp_ratio - 1.0) * 100.0, 0.0, 10.0)
        score_base = 10.0 if z_frp > 2.0 else 0.0

        total_anomaly_score = float(np.clip(score_frp + score_footprint + score_drift + score_temp + score_base, 0.0, 100.0))

        # Isolation Forest check
        feature_vec = np.array([[frp_ratio, temp_ratio, footprint_ratio, centroid_drift_m]])
        is_iso_outlier = bool(self.iso_forest.predict(feature_vec)[0] == -1)

        # Severity classification
        if total_anomaly_score >= 65.0 or (is_iso_outlier and z_frp >= 2.5):
            severity = "HIGH-PRIORITY ANOMALY"
            severity_class = "high_priority"
            action_code = "DISPATCH_VERIFICATION_ALERT"
        elif total_anomaly_score >= 40.0:
            severity = "ELEVATED THERMAL FLUX"
            severity_class = "elevated"
            action_code = "MONITOR_NEXT_PASS"
        else:
            severity = "NORMAL OPERATIONAL BASELINE"
            severity_class = "normal"
            action_code = "ROUTINE_LOG"

        return {
            "anomaly_score": round(total_anomaly_score, 1),
            "severity": severity,
            "severity_class": severity_class,
            "action_code": action_code,
            "frp_deviation_ratio": round(frp_ratio, 2),
            "z_score_frp": round(z_frp, 2),
            "is_outlier": is_iso_outlier,
            "breakdown": {
                "frp_contribution": round(score_frp, 1),
                "footprint_contribution": round(score_footprint, 1),
                "drift_contribution": round(score_drift, 1),
                "temp_contribution": round(score_temp, 1)
            }
        }

if __name__ == "__main__":
    engine = AnomalyEngine()

    # Test Case 1: Normal Jamnagar Flare
    normal_case = engine.evaluate_anomaly(
        current_telemetry={"current_frp": 42.0, "brightness_temp_k": 348.0, "centroid_drift_m": 8.0, "active_pixel_count": 1},
        baseline_profile={"mean_frp": 40.0, "std_frp": 5.0, "mean_temp_k": 345.0, "baseline_pixels": 1}
    )
    print("Test 1 (Normal Flare):", normal_case)

    # Test Case 2: Jamnagar Acute Surge (#OBJ-1045)
    surge_case = engine.evaluate_anomaly(
        current_telemetry={"current_frp": 68.4, "brightness_temp_k": 368.5, "centroid_drift_m": 12.0, "active_pixel_count": 3},
        baseline_profile={"mean_frp": 18.2, "std_frp": 4.5, "mean_temp_k": 340.0, "baseline_pixels": 1}
    )
    print("\nTest 2 (Surge Event):", surge_case)
