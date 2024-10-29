import requests
import json

user_message = input("Enter the message you want to post: ")
json_data = 
{
    "message": user_message  
}
webhook_url = "https://webhook.site/af400633-107b-449d-bf81-77279f483bcf"
response = requests.post(webhook_url, json=json_data)
print("POST request sent. Status code:", response.status_code)