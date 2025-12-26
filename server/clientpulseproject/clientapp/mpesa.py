import requests
import base64
from datetime import datetime
import os
import json

class MpesaClient:
    def __init__(self):
        self.consumer_key = os.environ.get('MPESA_CONSUMER_KEY')
        self.consumer_secret = os.environ.get('MPESA_CONSUMER_SECRET')
        self.env = os.environ.get('MPESA_ENV', 'sandbox')
        
        if self.env == 'sandbox':
            self.base_url = 'https://sandbox.safaricom.co.ke'
        else:
            self.base_url = 'https://api.safaricom.co.ke'

    def get_access_token(self):
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        auth_string = f"{self.consumer_key}:{self.consumer_secret}"
        encoded_auth = base64.b64encode(auth_string.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded_auth}"
        }
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            return response.json().get('access_token')
        except requests.exceptions.RequestException as e:
            print(f"Error generating access token: {e}")
            return None

    def stk_push(self, phone_number, amount, account_reference, transaction_desc):
        token = self.get_access_token()
        if not token:
            return {"error": "Failed to get access token"}

        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        
        shortcode = os.environ.get('MPESA_SHORTCODE')
        passkey = os.environ.get('MPESA_PASSKEY')
        callback_url = os.environ.get('MPESA_CALLBACK_URL')
        
        if not all([shortcode, passkey, callback_url]):
             return {"error": "Missing M-Pesa configuration (Shortcode, Passkey, or Callback URL)"}

        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_str = f"{shortcode}{passkey}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode()

        payload = {
            "BusinessShortCode": shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone_number,
            "PartyB": shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": callback_url,
            "AccountReference": account_reference,
            "TransactionDesc": transaction_desc
        }

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error initiating STK Push: {e}")
            try:
                return response.json()
            except:
                return {"error": str(e)}
