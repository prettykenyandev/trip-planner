# 🌍 Family Trip Planner

A shared trip planning app for the whole family — itinerary, packing list, budget tracker, and travel journal. All data syncs in real time via MongoDB so every family member sees the same information.

---

## 📁 Project Structure

```
trip-planner/
├── backend/
│   ├── server.js       # Express API
│   ├── models.js       # Mongoose schemas
│   └── package.json
├── frontend/
│   └── index.html      # Full single-page app
├── Dockerfile          # For Railway deployment
├── .env.example        # Environment variable template
└── .gitignore
```

---

## 🚀 Deploy to Railway (Step-by-Step)

### Step 1 — Push to GitHub

```bash
cd trip-planner
git init
git add .
git commit -m "Initial commit"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/trip-planner.git
git push -u origin main
```

### Step 2 — Create a Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project → Deploy from GitHub repo**
3. Select your `trip-planner` repository
4. Railway will detect the `Dockerfile` automatically

### Step 3 — Set Environment Variables on Railway

In your Railway project, go to **Variables** and add:

| Variable    | Value                                                                 |
|-------------|-----------------------------------------------------------------------|
| `MONGO_URI` | Your MongoDB connection string (see below)                           |
| `PORT`      | `3000`                                                                |

### Step 4 — Get Your MongoDB Connection String

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Select your cluster → click **Connect**
3. Choose **Connect your application**
4. Copy the connection string — it looks like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trip-planner?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual database user password
6. Paste it as the `MONGO_URI` variable in Railway

> **Important:** In MongoDB Atlas, go to **Network Access** and add `0.0.0.0/0` to allow connections from Railway's dynamic IPs.

### Step 5 — Deploy

Railway will automatically build and deploy when you push to GitHub.
Once deployed, click **Generate Domain** in Railway to get your public URL.

Share that URL with your family — everyone opens the same app and sees live data! 🎉

---

## 💻 Run Locally

```bash
cd trip-planner/backend
npm install

# Create your .env file
cp ../.env.example .env
# Edit .env and add your MONGO_URI

npm start
# App runs at http://localhost:3000
```

---

## 🔧 Environment Variables

| Variable   | Required | Description                        |
|------------|----------|------------------------------------|
| `MONGO_URI`| ✅ Yes   | MongoDB Atlas connection string    |
| `PORT`     | Optional | Defaults to `3000`                 |

---

## 🌐 API Endpoints

| Method | Path                          | Description              |
|--------|-------------------------------|--------------------------|
| GET    | `/api/trip`                   | Load entire trip state   |
| POST   | `/api/trip/destinations`      | Add destination          |
| DELETE | `/api/trip/destinations/:id`  | Remove destination       |
| POST   | `/api/trip/events`            | Add event                |
| DELETE | `/api/trip/events/:id`        | Remove event             |
| POST   | `/api/trip/pack`              | Add packing item         |
| PATCH  | `/api/trip/pack/:id`          | Toggle packed state      |
| DELETE | `/api/trip/pack/:id`          | Remove packing item      |
| PATCH  | `/api/trip/budget`            | Update budget/currency   |
| POST   | `/api/trip/expenses`          | Add expense              |
| DELETE | `/api/trip/expenses/:id`      | Remove expense           |
| POST   | `/api/trip/notes`             | Add journal entry        |
| PATCH  | `/api/trip/notes/:id`         | Edit journal entry       |
| DELETE | `/api/trip/notes/:id`         | Delete journal entry     |

---

## ✈️ Happy Travels!
