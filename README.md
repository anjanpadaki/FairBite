# 🍽️ FairBite

**FairBite** is a full-stack MERN application designed as a rule-based conflict resolution engine for group dining decisions. 

Have you ever tried to decide where to eat with a group of friends, only to get stuck in an endless loop of "I don't know, what do you want?" FairBite utilizes advanced rule-based logic to solve this problem by intelligently suggesting the best restaurants based on group preferences while ensuring practical constraints (like geographic proximity and city limits) are respected.

## 🌟 Features

- **Intelligent Dining Conflict Resolution**: Analyzes the preferences of a group to pick a mutually agreeable dining spot.
- **Geographic Constraints Engine**: Prevents cross-city restaurant suggestions, ensuring that the selected places are optimally located for all users.
- **Integrated Maps & Logistics**: Built-in mapping features provide visual commute plans and restaurant locations.
- **"Aurora" Glassmorphism UI**: A premium, state-of-the-art frontend featuring sleek aesthetics, modern typography, fast interactivity, and subtle animations.

---

## 🛠️ Technology Stack

- **Frontend**: React (React-DOM, Recharts, React-Icons)
- **Backend**: Node.js & Express.js
- **Database**: MongoDB (via Mongoose)
- **Styling**: Vanilla CSS (Aurora Glassmorphism UI principles)

---

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed along with a MongoDB instance (local or Atlas).

### 1. Backend Setup

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder and configure your variables (e.g., `PORT`, `MONGO_URI`).
4. Start the backend Node server:
   ```bash
   npm run dev
   # or
   npm start
   ```

### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   The application should automatically open in your default browser at `http://localhost:3000`.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check out the repository to fork and make your own changes for the hackathon.
