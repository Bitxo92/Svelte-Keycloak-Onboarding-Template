<h1 align="center">
  <img src="images/svelte_keycloak.png" alt="Svelte + Keycloak Auth Flow" width="500"/>
  <br/>
  🔒Svelte + Keycloak Custom Onboarding Template 🔓
</h1>
<h3 align="center">
  End-to-end authentication and onboarding flow using <b>Keycloak</b> for identity management and <b>Svelte</b> for a reactive front end.
</h3>
<p align="center">
  <img width="1305" height="715" alt="image" src="https://github.com/user-attachments/assets/3087d0f5-89f5-4b57-b85f-5522b225761d" />

</p>

## 📝 About

This repository demonstrates how to **replace Keycloak’s built-in login UI with a custom onboarding and authentication flow** implemented in **Svelte**, while still using **Keycloak** as the identity provider and token service.

Instead of redirecting users to Keycloak’s hosted login page, this project adds an abstraction layer that lets you present branded, multi-step onboarding and custom sign-in/sign-up forms inside your app. Authentication and token management are handled via the official [`keycloak-js`](https://www.npmjs.com/package/keycloak-js) adapter.

## ⚙️ Installation

Follow these steps to set up the project locally. The instructions assume a Linux development machine (WSL is supported). They cover installing prerequisites, creating a Python virtualenv for `tai-keycloak`, running the Keycloak/Postgres containers, and starting the frontend.

**Prerequisites:**

- **Node.js**: install via `nvm` (recommended).
- **Docker Desktop**: or Docker Engine + docker-compose available on your system.
- **pyenv**: for managing Python versions and virtualenvs.

> [!NOTE]
> The instructions below assume a Linux environment (WSL is supported). Adjust commands if you're on macOS or Windows without WSL.

1. Install Node.js (recommended via `nvm`)

```bash
# install nvm (if you don't have it)
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
# restart shell or source nvm
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "$HOME/.nvm" || printf %s "$XDG_CONFIG_HOME/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# install recommended Node (LTS)
nvm install --lts
# use it
nvm use --lts

# verify
node -v
npm -v
```

2. Install pyenv and create a Python virtualenv for `tai-keycloak`

```bash
# install pyenv (follow https://github.com/pyenv/pyenv#installation if needed)
curl https://pyenv.run | bash

# add pyenv to your shell profile then reopen the shell or source the profile
export PATH="$HOME/.pyenv/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"

# install a Python version (example: 3.11.6)
pyenv install 3.11.6
pyenv virtualenv 3.11.6 tai-kc-env
pyenv activate tai-kc-env

# install tai-keycloak into the virtualenv
pip install tai-keycloak
```

> [!NOTE] >`tai-keycloak` is a helper CLI that scaffolds Keycloak + helper services using Docker. It simplifies local setups but you can skip it and use your own `docker-compose` or managed Keycloak instance.

3. Use `tai-kc` to scaffold and run Keycloak + supporting containers

```bash
# this command will create the docker-compose setup and start containers
tai-kc run

# follow the tai-keycloak prompts to configure admin user and realm if asked
```

Notes:

- The `tai-kc run` command normally brings up a Keycloak container and any helper services. It may create a `docker-compose.yml` for you.
- You must also have a PostgreSQL database available for Keycloak. You can either run PostgreSQL in Docker (recommended) or use an existing DB running in WSL.

[!WARNING]
Running Keycloak and Postgres with default or weak passwords is fine for local development but never acceptable for production. Use strong secrets and secure networks for real deployments.

4. Start a PostgreSQL container (if you need one locally)

```bash
# example docker run for Postgres
docker run --name keycloak-postgres -e POSTGRES_DB=keycloak -e POSTGRES_USER=keycloak -e POSTGRES_PASSWORD=changeme -p 5432:5432 -d postgres:15

# create the database and user if you used different credentials
```

5. Configure Keycloak to use the PostgreSQL database and create a test user

- If you're using `tai-kc` it may prompt and auto-configure a Keycloak realm and admin account. Otherwise:

  - Access Keycloak admin console at `http://localhost:8080/` (or as printed by `tai-kc`).
  - Log in with the admin account you created.
  - Create a realm, a client for the Svelte app, and a user for testing.

  [!NOTE]
  If `tai-kc` configured a realm for you, it may have already created a test user and client. Check the `tai-kc` output or the Keycloak admin console before creating duplicates.

6. Install frontend dependencies and run the Svelte app

```bash
# in project root
npm install
npm run dev

# open the app in your browser (vite output shows the URL, typically http://localhost:5173)
```

Troubleshooting & tips:

- If Keycloak can't connect to Postgres, check that the Postgres container is accessible from the Keycloak container (same Docker network). If running Postgres in WSL, use an IP or host that the Keycloak container can reach (or run Postgres in Docker for simplicity).
- For production deployments, prefer using externally managed DB and secure secrets (don't store credentials in plaintext in compose files).
- Consider using HttpOnly secure cookies for tokens instead of localStorage for improved XSS resistance.
