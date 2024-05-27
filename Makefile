launch: install run

install:
	@(cd back && npm install) && (cd front && npm install)

build:
	@(cd front && npm run build)

run:
	@(cd back && node Server.js)

stop:
	@killall node 2> /dev/null || true

fclean: stop

re: stop build run

test_back:
	@(cd back && npm run test)

test_front:
	@(cd front && npm run test)

# Define the .env.local file
ENV_FILE_FRONT=front/.env
ENV_FILE_BACK=back/.env

# If the .env.local file does not exist, create it
create-env:
	@echo "Creating env files..."
	@echo "REACT_APP_SOCKET_URL=localhost" > $(ENV_FILE_FRONT)
	@echo "REACT_APP_SOCKET_URL=localhost" > $(ENV_FILE_BACK)
	@echo "Created env files!"

# Example usage: make update-env NEW_URL=localhost
# Should be the IP address of the server
update-env:
	@echo "Updating REACT_APP_SOCKET_URL to $(NEW_URL) in env files..."
	@sed -i'' 's|^REACT_APP_SOCKET_URL=.*$$|REACT_APP_SOCKET_URL=$(NEW_URL)|' $(ENV_FILE_BACK)
	@sed -i'' 's|^REACT_APP_SOCKET_URL=.*$$|REACT_APP_SOCKET_URL=$(NEW_URL)|' $(ENV_FILE_BACK)
	@echo "Update complete."
