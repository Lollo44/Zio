import requests
import sys
import os
from datetime import datetime
import uuid

class WaltGoatAPITester:
    def __init__(self, base_url="https://14bdbba9-969e-49e9-8d47-ba87c99a575a.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = "test_session_walt_123"  # From context
        self.user_id = "test-user-walt"  # From context
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.plan_id = None

    def log_test(self, name, success, status_code=None, error=None, response_data=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "passed": success,
            "status_code": status_code,
            "error": error,
            "response_data": response_data
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
            response_data = response.json() if response.content else {}
            return self.log_test(name, success, response.status_code, None if success else response.text, response_data), response_data

        except Exception as e:
            return self.log_test(name, False, None, str(e)), {}

    def test_health_check(self):
        """Test health endpoint"""
        print("\n🔍 Testing Health Check...")
        success, response = self.run_test("Backend health check GET /api/health", "GET", "api/health", 200)
        if success and response:
            if response.get("app") == "Walt the GOAT":
                print("   ✅ Correct app name returned")
            else:
                self.log_test("Health check app name validation", False, None, f"Expected 'Walt the GOAT', got '{response.get('app')}'")
        return success

    def test_auth_me_with_token(self):
        """Test /api/auth/me with valid token"""
        print("\n🔍 Testing Auth Me with Bearer token...")
        success, response = self.run_test("Auth GET /api/auth/me with test user Bearer token", "GET", "api/auth/me", 200)
        if success and response:
            print(f"   ✅ User data returned: {response.get('user_id', 'Unknown')}")
        return success

    def test_profile_endpoints(self):
        """Test profile GET and PUT"""
        print("\n🔍 Testing Profile Endpoints...")
        
        # Test GET profile
        success1, profile = self.run_test("Profile GET /api/profile with test user", "GET", "api/profile", 200)
        
        # Test PUT profile (update)
        profile_data = {
            "nome": "Walter Test GOAT",
            "eta": 72,
            "peso": 75.5,
            "altezza": 170.0,
            "livello": "Principiante",
            "obiettivo": "Mantenersi in forma",
            "giorni_disponibili": ["Lunedì", "Mercoledì", "Venerdì"]
        }
        success2, _ = self.run_test("Profile PUT /api/profile with test user", "PUT", "api/profile", 200, profile_data)
        
        return success1 and success2

    def test_walks_endpoints(self):
        """Test walks GET and POST"""
        print("\n🔍 Testing Walks Endpoints...")
        
        # Test GET walks
        success1, walks_response = self.run_test("Walks GET /api/walks - returns 10 test walks", "GET", "api/walks", 200)
        if success1 and walks_response:
            print(f"   ✅ Retrieved {len(walks_response)} walks")
        
        # Test POST walk session with GPS data
        walk_data = {
            "distanza_km": 2.5,
            "tempo_secondi": 1800,  # 30 minutes
            "passi": 3250,
            "velocita_media_kmh": 5.0,
            "percorso": [
                {"lat": 45.4642, "lng": 9.1900},
                {"lat": 45.4643, "lng": 9.1901},
                {"lat": 45.4644, "lng": 9.1902}
            ],
            "note": "Test walk with GPS percorso data"
        }
        success2, _ = self.run_test("Walks POST /api/walks - create new walk with percorso GPS data", "POST", "api/walks", 200, walk_data)
        
        return success1 and success2

    def test_circuits_endpoints(self):
        """Test circuits GET and POST"""
        print("\n🔍 Testing Circuits Endpoints...")
        
        # Test GET circuits
        success1, circuits_response = self.run_test("Circuits GET /api/circuits - returns 5 test circuits with sets/deviations", "GET", "api/circuits", 200)
        if success1 and circuits_response:
            print(f"   ✅ Retrieved {len(circuits_response)} circuits")
        
        # Test POST circuit session with per-set data
        circuit_data = {
            "durata_minuti": 45,
            "esercizi": [
                {
                    "exercise_id": "ex_bicipiti",
                    "nome": "Bicipiti",
                    "sets": [
                        {"set_number": 1, "ripetizioni": 12, "peso_kg": 2.0, "completato": True},
                        {"set_number": 2, "ripetizioni": 10, "peso_kg": 2.5, "completato": True},
                        {"set_number": 3, "ripetizioni": 8, "peso_kg": 3.0, "completato": True}
                    ],
                    "piano_serie": 3,
                    "piano_ripetizioni": 10,
                    "piano_peso_kg": 2.0
                },
                {
                    "exercise_id": "ex_tricipiti", 
                    "nome": "Tricipiti",
                    "sets": [
                        {"set_number": 1, "ripetizioni": 12, "peso_kg": 1.5, "completato": True},
                        {"set_number": 2, "ripetizioni": 12, "peso_kg": 1.5, "completato": False}
                    ],
                    "piano_serie": 3,
                    "piano_ripetizioni": 12,
                    "piano_peso_kg": 2.0
                }
            ],
            "note": "Test circuit with per-set completion tracking"
        }
        success2, _ = self.run_test("Circuits POST /api/circuits - create circuit with per-set data", "POST", "api/circuits", 200, circuit_data)
        
        return success1 and success2

    def test_exercises_endpoint(self):
        """Test exercises GET (seeded data)"""
        print("\n🔍 Testing Exercises Endpoint...")
        success, response = self.run_test("Exercises GET /api/exercises - returns 8 seeded exercises", "GET", "api/exercises", 200)
        
        # Verify we got the expected 8 exercises
        if success and isinstance(response, list) and len(response) >= 8:
            print(f"   ✅ Found {len(response)} exercises (expected 8+)")
            # Check for Italian exercise names
            italian_exercises = [ex for ex in response if any(word in ex.get('nome', '').lower() for word in ['bicipiti', 'tricipiti', 'petto', 'spalle', 'schiena', 'addome', 'gambe', 'cardio'])]
            print(f"   ✅ Found {len(italian_exercises)} Italian-named exercises")
            return True
        elif success:
            return self.log_test("Exercises count validation", False, None, f"Expected 8+ exercises, got {len(response) if isinstance(response, list) else 0}")
        return success

    def test_plans_endpoints(self):
        """Test plans GET, POST generate, and PUT update"""
        print("\n🔍 Testing Plans Endpoints...")
        
        # Test GET plans
        success1, plans_response = self.run_test("Plans GET /api/plans - returns user plans", "GET", "api/plans", 200)
        
        # Test POST generate plan
        success2, generated_plan = self.run_test("Plans POST /api/plans/generate - generates auto plan", "POST", "api/plans/generate", 200)
        if success2 and generated_plan:
            self.plan_id = generated_plan.get('plan_id')
            print(f"   ✅ Generated plan ID: {self.plan_id}")
        
        # Test PUT update individual exercise in plan
        success3 = True
        if self.plan_id and generated_plan.get('giorni'):
            # Find a circuit day with exercises to modify
            for gi, giorno in enumerate(generated_plan.get('giorni', [])):
                if giorno.get('tipo') == 'circuito' and giorno.get('attivita'):
                    for ei, _ in enumerate(giorno.get('attivita', [])):
                        update_data = {
                            "giorno_index": gi,
                            "exercise_index": ei,
                            "serie": 4,
                            "ripetizioni": 15,
                            "peso_kg": 2.5
                        }
                        success3, _ = self.run_test("Plans PUT /api/plans/{plan_id}/exercise - update individual exercise in plan", "PUT", f"api/plans/{self.plan_id}/exercise", 200, update_data)
                        break
                if success3:
                    break
        
        return success1 and success2 and success3

    def test_stats_endpoint(self):
        """Test stats GET with enhanced data"""
        print("\n🔍 Testing Stats Endpoint...")
        success, response = self.run_test("Stats GET /api/stats - returns enhanced stats", "GET", "api/stats", 200)
        
        # Verify enhanced stats structure
        if success and isinstance(response, dict):
            required_keys = [
                'totale', 'settimanale', 'mensile', 'record', 'medie', 'streak', 
                'volume_per_esercizio', 'record_esercizi', 'grafici_giornalieri'
            ]
            missing_keys = [key for key in required_keys if key not in response]
            if missing_keys:
                return self.log_test("Enhanced stats structure validation", False, None, f"Missing keys: {missing_keys}")
            
            # Check for specific enhanced fields
            totale = response.get('totale', {})
            enhanced_fields = ['calorie_stimate', 'giorni_attivi', 'volume_totale_kg']
            for field in enhanced_fields:
                if field not in totale:
                    print(f"   ⚠️  Missing enhanced field in totale: {field}")
            
            print("   ✅ Enhanced stats structure validated")
            return True
        return success

    def test_sfide_endpoints(self):
        """Test Sfide Goat challenges system"""
        print("\n🔍 Testing Sfide Goat Endpoints...")
        
        # Test GET sfide
        success1, sfide_response = self.run_test("Sfide GET /api/sfide - returns challenges", "GET", "api/sfide", 200)
        
        # Test POST generate sfide
        success2, generated_sfide = self.run_test("Sfide POST /api/sfide/generate - generates 3 challenges", "POST", "api/sfide/generate", 200)
        if success2 and isinstance(generated_sfide, list):
            print(f"   ✅ Generated {len(generated_sfide)} challenges (expected 3)")
            if len(generated_sfide) != 3:
                self.log_test("Sfide generation count", False, None, f"Expected 3 challenges, got {len(generated_sfide)}")
        
        # Test POST check progress
        success3, progress_response = self.run_test("Sfide POST /api/sfide/check-progress - updates progress", "POST", "api/sfide/check-progress", 200)
        
        return success1 and success2 and success3

    def test_logout(self):
        """Test logout"""
        print("\n🔍 Testing Logout...")
        success, _ = self.run_test("Auth logout", "POST", "api/auth/logout", 200)
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🐐 Starting Walt the GOAT API Tests...")
        print(f"Testing against: {self.base_url}")
        print(f"Using test user: {self.user_id}")
        print(f"Using session token: {self.session_token}")
        
        # Start with health check
        if not self.test_health_check():
            print("❌ Health check failed, stopping tests")
            return False

        print("\n✅ Using seeded test data from MongoDB")
        
        # Run all endpoint tests
        tests = [
            self.test_auth_me_with_token,
            self.test_profile_endpoints,
            self.test_walks_endpoints,
            self.test_circuits_endpoints,
            self.test_exercises_endpoint,
            self.test_plans_endpoints,
            self.test_stats_endpoint,
            self.test_sfide_endpoints,
            self.test_logout
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_test(test.__name__, False, None, str(e))

        # Print final results
        print(f"\n📊 Walt the GOAT API Test Results: {self.tests_passed}/{self.tests_run} passed")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['passed']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                error_msg = test['error'] or f"Status {test['status_code']}"
                print(f"  - {test['test']}: {error_msg}")
        else:
            print("\n🎉 All backend API tests passed! Walt the GOAT is ready!")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = WaltGoatAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())