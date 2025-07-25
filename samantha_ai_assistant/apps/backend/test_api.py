import pytest
from httpx import AsyncClient
from samantha_ai_assistant.apps.backend.main import app


@pytest.mark.asyncio
async def test_status():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        resp = await ac.get("/api/v1/status")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        resp = await ac.get("/api/v1/monitoring/health")
        assert resp.status_code == 200
        assert "cpu_percent" in resp.json()


@pytest.mark.asyncio
async def test_login_and_secure():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        login = await ac.post(
            "/api/v1/auth/login",
            data={"username": "demo", "password": "demo"}
        )
        assert login.status_code == 200
        token = login.json()["access_token"]
        secure = await ac.get(
            "/api/v1/secure-data",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert secure.status_code == 200
        assert "user" in secure.json()


@pytest.mark.asyncio
async def test_automation_command():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        resp = await ac.post(
            "/api/v1/automation/command",
            data={"command": "Open Safari"}
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "queued"


@pytest.mark.asyncio
async def test_analytics_log_and_stats():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        await ac.post(
            "/api/v1/analytics/log-command",
            data={"command": "Open Safari"}
        )
        stats = await ac.get("/api/v1/analytics/usage-stats")
        assert stats.status_code == 200
        assert "command_counts" in stats.json()


@pytest.mark.asyncio
async def test_error_handling():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        resp = await ac.get("/api/v1/nonexistent")
        assert resp.status_code in (404, 500)
