import pickle
import numpy as np
from flask import current_app

class FraudDetectionService:
    def __init__(self):
        self.model = None

    def load_model(self):
        if self.model is None:
            try:
                model_path = current_app.config['MODEL_PATH']
                with open(model_path, "rb") as file:
                    self.model = pickle.load(file)
                print(f"Model loaded from {model_path}")
            except Exception as e:
                print(f"Error loading model: {e}")
                raise e

    def predict(self, features):
        if self.model is None:
            self.load_model()
        
        try:
            # Reshape features for prediction
            features_array = np.array(features).reshape(1, -1)
            prediction = self.model.predict(features_array)
            probability = self.model.predict_proba(features_array)
            return {
                "prediction": prediction.tolist(),
                "probability": probability.tolist()
            }
        except Exception as e:
            print(f"Prediction error: {e}")
            raise e

# Singleton instance
fraud_service = FraudDetectionService()
