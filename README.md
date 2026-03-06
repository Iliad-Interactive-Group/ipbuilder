# Broadcast InSite Pro

This is a Next.js application for managing broadcast equipment inventory and maintenance, integrated with Firebase for backend services.

## Getting Started

### 1. Set up Firebase

1.  Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
2.  Enable **Firestore** as your database.
3.  In your project settings, find your web app's Firebase configuration object.
4.  Create a new file `src/lib/firebase-config.ts`.
5.  Copy the configuration into `src/lib/firebase-config.ts` like this:

    ```ts
    // src/lib/firebase-config.ts
    export const firebaseConfig = {
      apiKey: "AIza....",
      authDomain: "your-project-id.firebaseapp.com",
      projectId: "your-project-id",
      storageBucket: "your-project-id.appspot.com",
      messagingSenderId: "...",
      appId: "...",
      measurementId: "..."
    };
    ```

### 2. Set up Environment Variables

1.  Create a file named `.env.local` in the root of your project.
2.  Add your Gemini API key to this file:
    ```
    GEMINI_API_KEY="your_gemini_api_key"
    ```

### 3. Install Dependencies and Run

First, install the necessary packages:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

### 4. (Recommended) Set up Automatic Archival Cleanup (TTL)

This application uses a "soft-delete" strategy where deleted items are moved to an `archive` collection. To prevent this collection from growing indefinitely, you can set up a Time-to-Live (TTL) policy in Firestore to automatically delete old archived documents.

1.  Go to your **Firebase Console**.
2.  Navigate to **Firestore Database** > **TTL**.
3.  Click **Create Policy**.
4.  For the **Collection**, select the `archive` collection.
5.  For the **Timestamp field**, enter `archivedAt`.
6.  For **TTL state**, select **Enabled**.
7.  Set your desired retention period (e.g., 30, 60, or 90 days). Documents in the `archive` collection will be automatically and permanently deleted after this period.
8.  Click **Save**.

This ensures your database stays clean and cost-effective over time.

## Application Structure

*   **`/src/app`**: Contains the main application pages and layouts, following the Next.js App Router structure.
*   **`/src/components`**: Reusable React components used throughout the application.
*   **`/src/lib`**: Core application logic, including Firebase initialization, server actions for data manipulation, custom hooks, and type definitions.
*   **`/src/ai`**: Pre-configured Genkit flows for server-side AI interactions.
*   **`/public`**: Static assets.
