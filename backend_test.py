import requests
import sys
import os
from datetime import datetime
import uuid

class WalterAPITester:
    def __init__(self, base_url="https://14bdbba9-969e-49e9-8d47-ba87c99a575a.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, status_code=None, error=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "passed": success,
            "status_code": status_code,
            "error": error
        }
        self.test_results.append(result)
        
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {name}" + (f" (Status: {status_code})" if status_code else "") + (f" - Error: {error}" if error else ""))
        
        return success

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            return self.log_test(name, success, response.status_code), response.json() if success and response.content else {}

        except Exception as e:
            return self.log_test(name, False, None, str(e)), {}

    def test_health_check(self):
        """Test health endpoint"""
        print("\n🔍 Testing Health Check...")
        success, response = self.run_test("Health Check", "GET", "api/health", 200)
        return success

    def create_test_user_session(self):
        """Create test user and session directly in database for testing"""
        print("\n🔍 Creating Test User & Session...")
        
        # Use the real session token created via MongoDB
        self.session_token = "test_session_1770984169417"
        self.user_id = "test-user-1770984169417"
        
        print(f"Using User ID: {self.user_id}")
        print(f"Using Session Token: {self.session_token}")
        
        return True

    def test_auth_me_without_token(self):
        """Test /api/auth/me without token (should fail)"""
        print("\n🔍 Testing Auth Me (No Token)...")
        # Temporarily clear token
        temp_token = self.session_token
        self.session_token = None
        success, _ = self.run_test("Auth Me (No Token)", "GET", "api/auth/me", 401)
        self.session_token = temp_token
        return success

    def test_auth_me_with_token(self):
        """Test /api/auth/me with valid token"""
        print("\n🔍 Testing Auth Me (With Token)...")
        success, response = self.run_test("Auth Me (With Token)", "GET", "api/auth/me", 200)
        return success

    def test_profile_endpoints(self):
        """Test profile GET and PUT"""
        print("\n🔍 Testing Profile Endpoints...")
        
        # Test GET profile
        success1, profile = self.run_test("Get Profile", "GET", "api/profile", 200)
        
        # Test PUT profile (update)
        profile_data = {
            "nome": "Walter Test User",
            "eta": 72,
            "peso": 75.5,
            "altezza": 170.0,
            "livello": "principiante",
            "obiettivo": "mantenimento",
            "giorni_disponibili": ["Lunedì", "Mercoledì", "Venerdì"]
        }
        success2, _ = self.run_test("Update Profile", "PUT", "api/profile", 200, profile_data)
        
        return success1 and success2

    def test_walks_endpoints(self):
        """Test walks GET and POST"""
        print("\n🔍 Testing Walks Endpoints...")
        
        # Test GET walks
        success1, _ = self.run_test("Get Walks", "GET", "api/walks", 200)
        
        # Test POST walk session
        walk_data = {
            "distanza_km": 2.5,
            "tempo_secondi": 1800,  # 30 minutes
            "passi": 3000,
            "velocita_media_kmh": 5.0,
            "note": "Test walk session"
        }
        success2, _ = self.run_test("Create Walk Session", "POST", "api/walks", 200, walk_data)
        
        return success1 and success2

    def test_circuits_endpoints(self):
        """Test circuits GET and POST"""
        print("\n🔍 Testing Circuits Endpoints...")
        
        # Test GET circuits
        success1, _ = self.run_test("Get Circuits", "GET", "api/circuits", 200)
        
        # Test POST circuit session
        circuit_data = {
            "durata_minuti": 45,
            "esercizi": [
                {
                    "exercise_id": "ex_bicipiti",
                    "nome": "Bicipiti",
                    "serie": 3,
                    "ripetizioni": 12,
                    "peso_kg": 2.0
                },
                {
                    "exercise_id": "ex_tricipiti", 
                    "nome": "Tricipiti",
                    "serie": 3,
                    "ripetizioni": 12,
                    "peso_kg": 2.0
                }
            ],
            "note": "Test circuit session"
        }
        success2, _ = self.run_test("Create Circuit Session", "POST", "api/circuits", 200, circuit_data)
        
        return success1 and success2

    def test_exercises_endpoint(self):
        """Test exercises GET (seeded data)"""
        print("\n🔍 Testing Exercises Endpoint...")
        success, response = self.run_test("Get Exercises", "GET", "api/exercises", 200)
        
        # Verify we got some exercises back
        if success and isinstance(response, list) and len(response) > 0:
            print(f"   Found {len(response)} exercises")
            return True
        elif success:
            return self.log_test("Exercises Response Validation", False, None, "Empty exercises list")
        return success

    def test_plans_endpoints(self):
        """Test plans GET and POST"""
        print("\n🔍 Testing Plans Endpoints...")
        
        # Test GET plans
        success1, _ = self.run_test("Get Plans", "GET", "api/plans", 200)
        
        # Test POST generate plan
        success2, _ = self.run_test("Generate Plan", "POST", "api/plans/generate", 200)
        
        # Test POST create custom plan
        plan_data = {
            "nome": "Test Custom Plan",
            "tipo": "custom",
            "giorni": [
                {
                    "giorno": "Lunedì",
                    "tipo": "camminata",
                    "attivita": [{"nome": "Camminata", "durata_minuti": 30}]
                }
            ]
        }
        success3, _ = self.run_test("Create Custom Plan", "POST", "api/plans", 200, plan_data)
        
        return success1 and success2 and success3

    def test_stats_endpoint(self):
        """Test stats GET"""
        print("\n🔍 Testing Stats Endpoint...")
        success, response = self.run_test("Get Stats", "GET", "api/stats", 200)
        
        # Verify response structure
        if success and isinstance(response, dict):
            required_keys = ['totale', 'settimanale', 'record', 'grafici_camminate', 'grafici_circuiti']
            missing_keys = [key for key in required_keys if key not in response]
            if missing_keys:
                return self.log_test("Stats Response Structure", False, None, f"Missing keys: {missing_keys}")
            print("   Stats response structure valid")
            return True
        return success

    def test_logout(self):
        """Test logout"""
        print("\n🔍 Testing Logout...")
        success, _ = self.run_test("Logout", "POST", "api/auth/logout", 200)
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Walter the Walker API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Start with health check
        if not self.test_health_check():
            print("❌ Health check failed, stopping tests")
            return False

        # For this test, we'll assume we have a valid session
        # In real scenarios, this would come from MongoDB setup
        self.create_test_user_session()
        
        # Note: Using real MongoDB session for comprehensive testing
        print("\n✅ Using real MongoDB session for comprehensive testing")
        
        # Run all endpoint tests
        tests = [
            self.test_auth_me_without_token,
            self.test_auth_me_with_token,
            self.test_profile_endpoints,
            self.test_walks_endpoints,
            self.test_circuits_endpoints,
            self.test_exercises_endpoint,
            self.test_plans_endpoints,
            self.test_stats_endpoint,
            self.test_logout
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_test(test.__name__, False, None, str(e))

        # Print final results
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['passed']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                error_msg = test['error'] or f"Status {test['status_code']}"
                print(f"  - {test['test']}: {error_msg}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = WalterAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())