# G-Fragrance account system

## What was added
- `signup.html` — account creation page
- `login.html` — login page
- `terms.html` — starter Terms & Conditions
- `auth.css` — premium authentication/terms styling
- `auth.js` — form/API handling
- `server.js` — Express backend and authentication API
- `package.json` — required Node.js packages
- `.env.example` — environment variables template

## Requirements
Install Node.js (LTS) on your computer. SQLite is included through the `better-sqlite3` package, so you do not need to install a separate database server for this local project.

## Run the website
Open the `practice` folder in VS Code, then open the VS Code terminal:

```bash
npm install
npm start
```

Open:

`http://localhost:3000`

Do not use only Live Server for the login/signup pages because the forms send requests to the Node.js backend.

## Environment secret
Copy `.env.example` to `.env` and replace `SESSION_SECRET` with a long random value before using the app outside local testing.

## Database
The first time the server runs, it creates `gfragrance.db` and a SQLite session database automatically. User passwords are stored as bcrypt hashes, not plain text.

## Signup username
The signup form asks for name, email, phone and password, as requested. The server automatically creates a username from the user's name and displays it after signup. The username is then used on the login page.

## Important production note
Before accepting real customer payments or publishing the authentication system publicly, add HTTPS, stronger account recovery/email verification, rate limiting, a production-grade secret, database backups, privacy policy, and a legally reviewed refund/delivery policy.
