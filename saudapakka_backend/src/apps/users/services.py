import requests
from django.conf import settings

class SandboxKYCService:
    @staticmethod
    def get_headers():
        return {
            "x-api-key": settings.SANDBOX_API_KEY,
            "x-api-secret": settings.SANDBOX_API_SECRET,
            "x-api-version": "1.0",
            "Content-Type": "application/json"
        }

    @classmethod
    def initiate_digilocker(cls):
        # ... (Method from Step 2 remains here) ...
        url = f"{settings.SANDBOX_BASE_URL}/digilocker/id/initiate"
        payload = {
            "redirect_url": "https://saudapakka.com/kyc/callback", 
            "purpose": "User KYC for Real Estate Platform"
        }
        response = requests.post(url, json=payload, headers=cls.get_headers())
        return response.json()

    @classmethod
    def fetch_digilocker_data(cls, request_id):
        """
        Step 3: Fetch the verified Aadhaar details using the Request ID
        """
        url = f"{settings.SANDBOX_BASE_URL}/digilocker/id/status/{request_id}"
        response = requests.get(url, headers=cls.get_headers())
        return response.json()