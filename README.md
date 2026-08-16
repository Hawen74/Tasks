this is a productivity project
TASK BOARD + POROMO TIMER
- 3 columns: Task - Doing - Done
- Timer for each cycle

// How to set up a new project
1/ npm create vite@latest frontend
+ React
+ Typescript
+ ESLint
2/ install packages frontend folder
+ npm install tailwindcss @tailwindcss/vite
+ npm install axios react-router-dom

// Structure
mkdir src/api
mkdir src/components
mkdir src/features
mkdir src/hooks
mkdir src/layouts
mkdir src/pages
mkdir src/routes
mkdir src/types
mkdir src/utils

3/ Create backend
cd ..
mkdir backend
cd backend

// Initialize the project.
npm init -y 

// Install runtime dependencies:
npm install express cors dotenv pg

// Install development dependencies:
npm install -D typescript tsx @types/node @types/express @types/cors

// Initialize TypeScript.
npx tsc --init

// Structure
mkdir -p src/{config,controllers,db,middlewares,models,repositories,routes,services,types,utils}

// package.json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}

4/ Start codinng backend
- fix at package.json: convert type: commonJs to module
- databsee + type.ts (make sure type matching with database)
+ SQL
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL
        CHECK (status IN ('Created', 'Doing', 'Completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
+ type: base on DB to decide which types
- connenct database using Pool in database.ts
+ using url in .env file
- start all routes: get, post, put, delete
+ async and await for database
+ try catch 
+ return status if it fail or success

5/ Frontend
- html and css first
- use route at app.tsx
- use navigate for button click
- get data from backend using axios
+ put and delete: using `` to get data id by using ${}
+ return type for each function
+ useState + useEfffect to get recent data
+ useEffect use function to use await and async
Tracker
    ↓
API (Axios)
    ↓
Express
    ↓
PostgreSQL
- create a form: using onChange to change  value

- start with anxios

6/ REST API Design & Auth

7/ Docker
## Setup
Clone this repo, run `docker-compose up`, done.