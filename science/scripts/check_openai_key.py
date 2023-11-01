import sys
from app import create_app
from app.utils import get_tenant_openai_key


if __name__ == "__main__":
    user_id = sys.argv[1]
    print(f"Checking user_id {user_id}")

    app = create_app()
    with app.app_context():
        # '6833f8ac-e01a-464c-a543-cbbf95d644e7'
        print(get_tenant_openai_key(user_id=user_id))