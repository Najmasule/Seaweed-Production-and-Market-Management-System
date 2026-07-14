from django.test import TestCase
from django.core.cache import cache
from rest_framework.test import APIClient
from farmers.serializers import RegisterSerializer


class RegisterSerializerTests(TestCase):
    def test_register_serializer_accepts_and_hashes_password(self):
        payload = {
            "username": "testfarmer1",
            "email": "testfarmer1@example.com",
            "password": "Strong@123",
            "first_name": "Test",
            "last_name": "Farmer",
            "location": "Zanzibar",
            "phone": "0712345678",
            "role": "farmer",
        }

        serializer = RegisterSerializer(data=payload)

        self.assertTrue(serializer.is_valid(), serializer.errors)

        farmer = serializer.save()
        self.assertEqual(farmer.username, payload["username"])
        self.assertEqual(farmer.phone, payload["phone"])
        self.assertEqual(farmer.role, payload["role"])
        self.assertTrue(farmer.check_password(payload["password"]))

    def test_farmer_endpoint_allows_public_registration(self):
        response = APIClient().post(
            "/api/farmers/",
            {"username": "amina", "password": "Aminahaji20@213"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["username"], "amina")

    def test_login_and_authenticated_post_get_endpoints(self):
        client = APIClient()
        credentials = {"username": "api_tester", "password": "Strong@123"}

        registration = client.post("/api/register/", credentials, format="json")
        self.assertEqual(registration.status_code, 201)

        login = client.post("/api/login/", credentials, format="json")
        self.assertEqual(login.status_code, 200)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

        farmers = client.get("/api/farmers/")
        self.assertEqual(farmers.status_code, 200)
        self.assertIsNotNone(cache.get("api:farmers:list"))

        farmer_id = registration.data["id"]
        farmer_update = client.patch(f"/api/farmers/{farmer_id}/", {"location": "Zanzibar"}, format="json")
        self.assertEqual(farmer_update.status_code, 200)
        self.assertIsNone(cache.get("api:farmers:list"))

        endpoints = [
            ("/api/production/", "api:production:list", {"farmer": farmer_id, "date": "2026-07-11", "quantity": 25.5, "type": "eucheuma"}, {"quantity": 30}),
            ("/api/inventory/", "api:inventory:list", {"farmer": farmer_id, "item_name": "Dry seaweed", "quantity": "10.00", "quality_grade": "A", "status": "available"}, {"status": "sold"}),
            ("/api/market/", "api:market:list", {"product_type": "eucheuma", "price_per_kg": "1500.00", "demand_level": "high"}, {"demand_level": "medium"}),
            ("/api/reports/", "api:reports:list", {"created_by": farmer_id, "title": "Test report", "content": "API integration test."}, {"title": "Updated test report"}),
        ]

        for url, cache_key, payload, update in endpoints:
            created = client.post(url, payload, format="json")
            self.assertEqual(created.status_code, 201)
            self.assertEqual(client.get(url).status_code, 200)
            self.assertIsNotNone(cache.get(cache_key))

            detail_url = f"{url}{created.data['id']}/"
            self.assertEqual(client.patch(detail_url, update, format="json").status_code, 200)
            self.assertIsNone(cache.get(cache_key))
            self.assertEqual(client.delete(detail_url).status_code, 204)
