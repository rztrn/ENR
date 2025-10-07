# forwarder.py
import requests
from django.utils import timezone
from api.models import MasAPIToken
from api.serializers import VoyageReportSerializer, VoyageListMASSerializer
from django.db.models import F

TOKEN_URL = "http://www.mascrm.cloud:6499/api/token"
FORWARD_URL = "http://www.mascrm.cloud:6499/api/VesselActivity/"

CREDENTIALS = {
    "companyCode": "SIP",
    "username": "ibt2",
    "password": "123456",
    "hostAddress": "192.168.1.112",  # or localhost on live
}

def get_token():
    """
    Get cached token from DB or request a new one.
    """
    token_obj = MasAPIToken.objects.order_by("-created_at").first()

    if token_obj and not token_obj.is_expired():
        return token_obj.token

    # Request new token
    response = requests.post(TOKEN_URL, json=CREDENTIALS, timeout=10)
    response.raise_for_status()
    data = response.json()
    token = data.get("access_token")

    if not token:
        raise Exception("No token in response")

    # Save to DB
    MasAPIToken.objects.create(token=token)
    return token

def forward_voyage_report(voyage_report_instance):
    """
    Serialize and forward a VoyageReport instance to MAS CRM API
    """
    serializer = VoyageListMASSerializer(voyage_report_instance)
    data = serializer.data

    token = get_token()
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    response = requests.post(FORWARD_URL, json=data, headers=headers, timeout=10)

    # If token expired, retry once
    if response.status_code == 401:
        token = get_token()  # refresh
        headers["Authorization"] = f"Bearer {token}"
        response = requests.post(FORWARD_URL, json=data, headers=headers, timeout=10)

    response.raise_for_status()
    return response.json() if response.content else {"status": "ok"}
