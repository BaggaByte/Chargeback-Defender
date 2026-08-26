import os
import sys
from dotenv import load_dotenv

# Note: In a real environment, you would run `pip install rocketride`
# For the sake of this blueprint/architecture definition, we mock the import
# if the actual SDK is not installed in the environment.
try:
    from rocketride import RocketRideClient
except ImportError:
    print("Warning: rocketride package not found. Using Mock client for demonstration.", file=sys.stderr)
    
    class MockDeployApi:
        def add(self, pipe_content):
            print("[MockDeployApi] Deploying .pipe configuration...")
            print(f"[MockDeployApi] Uploaded {len(pipe_content)} bytes.")
            return {"status": "success", "deployment_id": "dep_123456"}

    class RocketRideClient:
        def __init__(self, api_key, endpoint):
            self.api_key = api_key
            self.endpoint = endpoint
            self.deploy = MockDeployApi()

        def get_server_info(self):
            return {
                "server_status": "online",
                "version": "2.4.1",
                "capabilities": ["webhook", "extract_facts", "agent_crewai", "llm_gemini", "guardrails", "memory_persistent"],
                "endpoint": self.endpoint
            }


def main():
    # Load environment variables (e.g. ROCKETRIDE_API_KEY)
    load_dotenv()
    
    api_key = os.getenv("ROCKETRIDE_API_KEY", "sk_rr_test_mock123")
    endpoint = os.getenv("ROCKETRIDE_ENDPOINT", "https://api.rocketride.ai:443")

    print(f"Connecting to RocketRide Engine at {endpoint}...")
    
    # Authenticate via RocketRideClient
    client = RocketRideClient(api_key=api_key, endpoint=endpoint)
    
    # Probe server capability and live status
    try:
        server_info = client.get_server_info()
        print("\n--- Server Info ---")
        print(f"Status: {server_info['server_status']}")
        print(f"Version: {server_info['version']}")
        print("Capabilities:", ", ".join(server_info['capabilities']))
        print("-------------------\n")
    except Exception as e:
        print(f"Failed to connect to RocketRide engine: {e}")
        sys.exit(1)

    # Read the pipeline configuration
    pipe_path = os.path.join(os.path.dirname(__file__), "chargeback_defender.pipe")
    if not os.path.exists(pipe_path):
        print(f"Error: Pipeline file not found at {pipe_path}")
        sys.exit(1)

    with open(pipe_path, "r") as f:
        pipe_content = f.read()

    print("Deploying Chargeback Defender Pipeline...")
    
    # Deploy the .pipe configuration dynamically
    try:
        result = client.deploy.add(pipe_content)
        if result.get("status") == "success":
            print(f"Deployment Successful! Deployment ID: {result.get('deployment_id')}")
        else:
            print(f"Deployment Failed: {result}")
    except Exception as e:
        print(f"Error during deployment: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
