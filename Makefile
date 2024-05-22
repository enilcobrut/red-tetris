launch: install run

install:
	@(cd back && npm install) && (cd front && npm install)

run:
	@(cd back && npm run dev &) && (cd front && npm run dev &)

stop:
	@killall node 2> /dev/null || true

fclean: stop

re: stop run

test_back:
	@(cd back && npm run test)

test_front:
	@(cd front && npm run test)

# Define the .env.local file
ENV_FILE=front/.env.local

# If the .env.local file does not exist, create it
create-env:
	@echo "Creating $(ENV_FILE)"
	@echo "NEXT_PUBLIC_SOCKET_URL=localhost" > $(ENV_FILE)
	@echo "Created $(ENV_FILE)"

# Example usage: make update-env NEW_URL=localhost
# Should be the IP address of the server
update-env:
	@echo "Updating NEXT_PUBLIC_SOCKET_URL to $(NEW_URL) in $(ENV_FILE)"
	@sed -i'' 's|^NEXT_PUBLIC_SOCKET_URL=.*$$|NEXT_PUBLIC_SOCKET_URL=$(NEW_URL)|' $(ENV_FILE)
	@echo "Update complete."
