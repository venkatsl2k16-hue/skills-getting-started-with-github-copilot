import copy
from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


# Ensure tests don't permanently mutate the in-memory activities
import pytest

@pytest.fixture(autouse=True)
def reset_activities():
    original = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(original)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Basketball" in data


def test_signup_and_unregister_flow():
    activity = "Basketball"
    test_email = "test_user@example.com"

    # make sure it's not present
    if test_email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(test_email)

    # signup
    resp = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # verify presence
    resp2 = client.get("/activities")
    assert test_email in resp2.json()[activity]["participants"]

    # unregister
    resp3 = client.post(f"/activities/{activity}/unregister?email={test_email}")
    assert resp3.status_code == 200
    assert "Unregistered" in resp3.json().get("message", "")

    # verify removed
    resp4 = client.get("/activities")
    assert test_email not in resp4.json()[activity]["participants"]


def test_unregister_not_signed_up_returns_404():
    activity = "Basketball"
    email = "noone@example.com"
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    resp = client.post(f"/activities/{activity}/unregister?email={email}")
    assert resp.status_code == 404
