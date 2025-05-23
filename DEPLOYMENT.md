# TransparenEats Deployment Guide

This guide covers how to deploy the TransparenEats application using Render for the backend API and Vercel for the frontend.

## Backend Deployment (Render)

### Prerequisites
- A Render account
- A GitHub repository with your TransparenEats code

### Steps

1. **Push your code to GitHub**
   - Make sure your code is in a GitHub repository
   - Ensure the backend code is in the `/backend` directory

2. **Create a PostgreSQL Database on Render**
   - Log in to your Render dashboard
   - Go to "New" > "PostgreSQL"
   - Name it `transpareneats-db`
   - Choose the Free plan
   - Click "Create Database"
   - Copy the "Internal Connection String" for the next step

3. **Deploy the Backend Service**
   - Go to "New" > "Web Service"
   - Connect your GitHub repository
   - Name the service `transpareneats-api`
   - Set the Root Directory to `backend`
   - Set Build Command: `npm install`
   - Set Start Command: `npm start`
   - Choose the Free plan
   - Add the following environment variables:
     - `NODE_ENV`: `production`
     - `DATABASE_URL`: [Your Render PostgreSQL connection string]
     - `PORT`: `3000`
     - Add your API keys for external services:
       - `OFF_USER`: [Your OpenFoodFacts username]
       - `OFF_PASS`: [Your OpenFoodFacts password]
       - `USDA_API_KEY`: [Your USDA API key]
       - `NUTRITIONIX_APP_ID`: [Your Nutritionix App ID]
       - `NUTRITIONIX_APP_KEY`: [Your Nutritionix App Key]
   - Click "Create Web Service"

4. **Verify Backend Deployment**
   - Wait for the deployment to complete
   - Test the API endpoint by visiting `https://transpareneats-api.onrender.com/api`
   - You should see a welcome message or API documentation

## Frontend Deployment (Vercel)

### Prerequisites
- A Vercel account
- A GitHub repository with your TransparenEats code

### Steps

1. **Update Frontend Environment**
   - Make sure the `.env` file in the `web` directory points to your Render backend:
     ```
     VITE_BACKEND_URL=https://transpareneats-api.onrender.com
     ```

2. **Deploy to Vercel**
   - Log in to your Vercel dashboard
   - Click "Add New" > "Project"
   - Import your GitHub repository
   - Configure the project:
     - Framework Preset: Vite
     - Root Directory: `web`
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - Click "Deploy"

3. **Verify Frontend Deployment**
   - Once deployment is complete, Vercel will provide a URL for your frontend
   - Test the application by visiting the provided URL
   - Ensure it can connect to your Render backend

## Troubleshooting

### Backend Issues
- Check Render logs if the service fails to start
- Verify the database connection string
- Make sure all required environment variables are set

### Frontend Issues
- Check Vercel build logs for any errors
- Verify that the backend URL is correctly set in the environment variables
- If the app builds but can't connect to the backend, check CORS settings in the backend code

## Local Testing Before Deployment

1. **Test Backend Locally**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Test Frontend Locally**
   ```bash
   cd web
   npm install
   npm run dev
   ```

3. **Verify API Connection**
   - Open the frontend in your browser
   - Verify it can connect to your local backend
   - Once confirmed, proceed with deployment 