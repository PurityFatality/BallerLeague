# BallerLeague (JavaScript Monorepo Style)

React + Express application using JavaScript only, Tailwind CSS v4, React Router, and express-validator.

## Stack

- Frontend: React, Vite, Tailwind CSS v4, React Router
- Backend: Express, express-validator
- Database (planned): MongoDB Atlas via Mongoose

## Project Structure

```
src/
   components/
   pages/
   App.jsx
   main.jsx
ballerleague-server/
   src/
      app.js
      server.js
      config/
         mongodb.js
      data/
         store.js
      middleware/
         validate.js
      routes/
         api.routes.js
      validators/
         *.validators.js
```

## Environment Variables

Create a `.env` file in `ballerleague-server`:

```
PORT=5000
MONGODB_URI=
```

`MONGODB_URI` is optional for now. If provided, the app attempts to connect to MongoDB Atlas.

## Run Locally

1. Install frontend dependencies

```bash
npm install
```

2. Install backend dependencies

```bash
cd ballerleague-server
npm install
```

3. Start backend

```bash
cd ballerleague-server
npm run dev
```

4. Start frontend

```bash
npm run dev
```

5. Build frontend

```bash
npm run build
```

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set the build command to `npm run build`
3. Set the output directory to `dist`
4. Configure environment variables if needed
5. Deploy

**Note:** The Vite dev proxy is only active during development. In production, ensure the `VITE_API_URL` or update frontend API calls to point to your Render backend URL.

### Backend (Render)

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the build command to `npm install --prefix ballerleague-server`
4. Set the start command to `cd ballerleague-server && npm start`
5. Configure environment variables:
   - `PORT=5000` (or leave default)
   - `MONGODB_URI=your_mongodb_atlas_connection_string`
6. Deploy

**Environment Variables on Render:**
- Add environment variables in the Render dashboard under "Environment"
- Set `MONGODB_URI` to your MongoDB Atlas connection string if using MongoDB
- The API will be available at `https://your-render-app-name.onrender.com`

### Connecting Frontend to Backend (Production)

After deploying both:

1. Update frontend API calls to use the Render backend URL:
   - In development: Vite proxy handles routing to `localhost:5000`
   - In production: Update API base URL to `https://your-render-app-name.onrender.com/api`

2. Consider adding a production environment variable:
   ```javascript
   const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';
   ```
