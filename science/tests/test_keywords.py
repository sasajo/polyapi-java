from .testing import DbTestCase
from keywords import keywords_similar


ACCUWEATHER = {
    "id": "f7588018-2364-4586-b60d-b08a285f1ea3",
    "name": "accuweatherGetlocation",
    "context": "",
    "description": "get the weather for a specific location (using locationid)",
    "arguments": [
        {"name": "locationId", "type": "string", "payload": False},
        {"name": "AAPIKey", "type": "string", "payload": False},
    ],
}
GOOGLE_MAPS = {
    "id": "60062c03-dcfd-437d-832c-6cba9543f683",
    "name": "gMapsGetXy",
    "context": "shipping",
    "description": "get the X and Y coordinates of a location from Google Maps",
    "arguments": [
        {"name": "location", "type": "string", "payload": True},
        {"name": "GAPIKey", "type": "string", "payload": False},
    ],
}
SERVICE_NOW = {
    "id": "bde87ad6-acbf-4556-9bd7-e27a479c0373",
    "name": "serviceNow.createIncident",
    "context": "incidentManagement",
    "description": "This API call allows users to create a new incident in ServiceNow's system. The user must provide a payload with all the fields needed to create the incident, such as short description, assigned group, and priority level. The response payload will contain the incident number and details, including its state, priority, and assigned user/group.",
    "arguments": [
        {"key": "impact", "name": "impact", "type": "string", "payload": True},
    ],
    "type": "url",
}


class T(DbTestCase):
    def test_keywords_similar_weather(self):
        # "how do I get the weather at a certain location?"
        keywords = "current weather location get"
        self.assertTrue(keywords_similar(keywords, ACCUWEATHER, debug=True))
        self.assertFalse(keywords_similar(keywords, GOOGLE_MAPS))
        self.assertFalse(keywords_similar(keywords, SERVICE_NOW))

    def test_keywords_similar_maps(self):
        # how do I get the geocoordinates of a location?
        keywords = "geocoordinates location get"
        self.assertTrue(keywords_similar(keywords, GOOGLE_MAPS))
        self.assertFalse(keywords_similar(keywords, ACCUWEATHER))
        self.assertFalse(keywords_similar(keywords, SERVICE_NOW))

    def test_keywords_similar_incident(self):
        # how do I create an incident on service now?
        keywords = "create incident service now"
        self.assertTrue(keywords_similar(keywords, SERVICE_NOW))
        self.assertFalse(keywords_similar(keywords, GOOGLE_MAPS))
        self.assertFalse(keywords_similar(keywords, ACCUWEATHER))
