"""
Backend API tests for Walt the GOAT - Exercise Database Features
Tests: exercises list, categories, alternatives, elastici mapping, plan generation
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session token created for testing
SESSION_TOKEN = "test_session_walt_1771011315941"

@pytest.fixture
def api_client():
    """Shared requests session with auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SESSION_TOKEN}"
    })
    return session


class TestHealthEndpoint:
    """Health check tests"""
    
    def test_health_returns_ok(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["app"] == "Walt the GOAT"


class TestExercisesAPI:
    """Exercise database API tests - 26 exercises in 7 categories"""
    
    def test_get_all_exercises(self, api_client):
        """GET /api/exercises returns all 26 exercises"""
        response = api_client.get(f"{BASE_URL}/api/exercises")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 26, f"Expected 26 exercises, got {len(data)}"
        
        # Verify exercise structure
        ex = data[0]
        assert "exercise_id" in ex
        assert "nome" in ex
        assert "categoria" in ex
        assert "descrizione_tecnica" in ex
        assert "serie_default" in ex
        assert "ripetizioni_default" in ex
    
    def test_get_exercises_by_category(self, api_client):
        """GET /api/exercises?categoria=Gambe returns filtered exercises"""
        response = api_client.get(f"{BASE_URL}/api/exercises?categoria=Gambe")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5, f"Expected 5 Gambe exercises, got {len(data)}"
        
        # All should be Gambe category
        for ex in data:
            assert ex["categoria"] == "Gambe"
    
    def test_get_exercises_categories(self, api_client):
        """GET /api/exercises/categories returns 7 categories"""
        response = api_client.get(f"{BASE_URL}/api/exercises/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categorie" in data
        expected_categories = ["Gambe", "Core", "Braccia", "Spalle", "Petto", "Schiena", "Cardio"]
        assert data["categorie"] == expected_categories
    
    def test_get_exercise_detail(self, api_client):
        """GET /api/exercises/{id} returns exercise details"""
        response = api_client.get(f"{BASE_URL}/api/exercises/ex_squat_sedia")
        assert response.status_code == 200
        data = response.json()
        assert data["exercise_id"] == "ex_squat_sedia"
        assert data["nome"] == "Squat con Sedia"
        assert data["categoria"] == "Gambe"
        assert "descrizione_tecnica" in data
        assert "varianti" in data
        assert "note_sicurezza" in data
    
    def test_get_exercise_not_found(self, api_client):
        """GET /api/exercises/{id} returns 404 for non-existent exercise"""
        response = api_client.get(f"{BASE_URL}/api/exercises/ex_nonexistent")
        assert response.status_code == 404


class TestExerciseAlternatives:
    """Smart Swap - Exercise alternatives API tests"""
    
    def test_get_alternatives_same_category(self, api_client):
        """GET /api/exercises/{id}/alternatives returns same-category exercises"""
        response = api_client.get(f"{BASE_URL}/api/exercises/ex_squat_sedia/alternatives")
        assert response.status_code == 200
        data = response.json()
        
        # Check original exercise
        assert "esercizio_originale" in data
        assert data["esercizio_originale"]["exercise_id"] == "ex_squat_sedia"
        assert data["esercizio_originale"]["categoria"] == "Gambe"
        
        # Check alternatives
        assert "alternative" in data
        alternatives = data["alternative"]
        assert len(alternatives) == 4, f"Expected 4 alternatives (5 Gambe - 1 original), got {len(alternatives)}"
        
        # All alternatives should be same category
        for alt in alternatives:
            assert alt["categoria"] == "Gambe"
            assert alt["exercise_id"] != "ex_squat_sedia"  # Should not include original
    
    def test_get_alternatives_for_core_exercise(self, api_client):
        """GET /api/exercises/{id}/alternatives for Core category"""
        response = api_client.get(f"{BASE_URL}/api/exercises/ex_crunch_sedia/alternatives")
        assert response.status_code == 200
        data = response.json()
        
        assert data["esercizio_originale"]["categoria"] == "Core"
        for alt in data["alternative"]:
            assert alt["categoria"] == "Core"
    
    def test_get_alternatives_not_found(self, api_client):
        """GET /api/exercises/{id}/alternatives returns 404 for non-existent"""
        response = api_client.get(f"{BASE_URL}/api/exercises/ex_nonexistent/alternatives")
        assert response.status_code == 404


class TestElasticiMapping:
    """Elastici (resistance bands) color-to-kg mapping tests"""
    
    def test_get_elastici_mapping(self, api_client):
        """GET /api/elastici returns color-kg mapping"""
        response = api_client.get(f"{BASE_URL}/api/elastici")
        assert response.status_code == 200
        data = response.json()
        
        # Check all 5 colors
        expected_colors = ["giallo", "rosso", "verde", "blu", "nero"]
        for color in expected_colors:
            assert color in data
            assert "kg_equivalente" in data[color]
            assert "descrizione" in data[color]
        
        # Verify specific values
        assert data["giallo"]["kg_equivalente"] == 1.5
        assert data["rosso"]["kg_equivalente"] == 3.0
        assert data["blu"]["kg_equivalente"] == 6.0


class TestPlanGeneration:
    """Plan generation with energia/focus/dolori inputs"""
    
    def test_generate_plan_basic(self, api_client):
        """POST /api/plans/generate creates a plan"""
        response = api_client.post(f"{BASE_URL}/api/plans/generate")
        assert response.status_code == 200
        data = response.json()
        
        assert "plan_id" in data
        assert "giorni" in data
        assert data["tipo"] == "automatico"
        assert data["attivo"] == True
    
    def test_generate_plan_with_energia(self, api_client):
        """POST /api/plans/generate with energia parameter"""
        response = api_client.post(
            f"{BASE_URL}/api/plans/generate",
            json={"energia": 3}  # Low energy
        )
        assert response.status_code == 200
        data = response.json()
        
        # Low energy should result in shorter walks
        for giorno in data["giorni"]:
            if giorno["tipo"] == "camminata":
                for att in giorno["attivita"]:
                    assert att["durata_minuti"] == 25  # Reduced from 30
    
    def test_generate_plan_with_focus_muscolare(self, api_client):
        """POST /api/plans/generate with focus_muscolare filter"""
        response = api_client.post(
            f"{BASE_URL}/api/plans/generate",
            json={"focus_muscolare": ["Gambe", "Core"]}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Circuit days should only have Gambe/Core exercises
        for giorno in data["giorni"]:
            if giorno["tipo"] == "circuito":
                for att in giorno["attivita"]:
                    assert att["categoria"] in ["Gambe", "Core", "Cardio"], \
                        f"Unexpected category: {att['categoria']}"
    
    def test_generate_plan_with_dolori_articolari(self, api_client):
        """POST /api/plans/generate excludes exercises for joint pain"""
        response = api_client.post(
            f"{BASE_URL}/api/plans/generate",
            json={"dolori_articolari": ["ginocchia"]}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should not include knee-stressing exercises
        excluded_exercises = ["ex_squat_sedia", "ex_affondi_supporto", "ex_step_up"]
        for giorno in data["giorni"]:
            if giorno["tipo"] == "circuito":
                for att in giorno["attivita"]:
                    assert att["exercise_id"] not in excluded_exercises, \
                        f"Exercise {att['exercise_id']} should be excluded for knee pain"
    
    def test_generate_plan_combined_inputs(self, api_client):
        """POST /api/plans/generate with all inputs combined"""
        response = api_client.post(
            f"{BASE_URL}/api/plans/generate",
            json={
                "energia": 8,
                "focus_muscolare": ["Braccia", "Spalle"],
                "dolori_articolari": ["spalle"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should exclude shoulder exercises
        excluded_exercises = ["ex_shoulder_press", "ex_alzate_laterali", "ex_alzate_frontali"]
        for giorno in data["giorni"]:
            if giorno["tipo"] == "circuito":
                for att in giorno["attivita"]:
                    assert att["exercise_id"] not in excluded_exercises


class TestAuthRequired:
    """Test that endpoints require authentication"""
    
    def test_exercises_requires_auth(self):
        """GET /api/exercises without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/exercises")
        assert response.status_code == 401
    
    def test_categories_requires_auth(self):
        """GET /api/exercises/categories without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/exercises/categories")
        assert response.status_code == 401
    
    def test_elastici_requires_auth(self):
        """GET /api/elastici without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/elastici")
        assert response.status_code == 401
