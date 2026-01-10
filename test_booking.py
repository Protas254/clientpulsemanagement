import requests
import json

url = 'http://localhost:8000/api/bookings/'
data = {
    "customer": "some-uuid", # I need a real customer UUID
    "service": "some-uuid", # I need a real service UUID
    "booking_date": "2023-12-01T10:00:00Z",
    "status": "pending"
}

# This is just a placeholder, I should get real IDs from the DB if possible
# Or check the code for potential pitfalls.

print("Testing booking creation...")
# response = requests.post(url, json=data)
# print(response.status_code)
# print(response.text)
