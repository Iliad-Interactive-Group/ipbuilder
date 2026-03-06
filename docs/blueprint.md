# **App Name**: Broadcast InSite Pro

## Core Features:

- Firebase Integration: Integrate Firebase for backend services to enable data persistence and authentication.
- Firestore Setup: Set up Firestore database collections for sites and equipment.
- Real-time Data Updates: Implement real-time updates using Firestore's onSnapshot to reflect data changes immediately in the UI.
- CRUD Operations Refactor: Refactor CRUD operations to use Firestore API for adding, updating, and deleting data.
- API Key Security: Secure the Gemini API key by routing calls through a Firebase Function.
- AI-Powered Recommendations: AI tool uses the current maintenance data when constructing reports, health analysis, and suggestions for broadcast equipment. It determines what information to incorporate based on user prompt and the overall health of the site and broadcasting equipment.
- Data Migration: Migrate the CSV import logic to a Firebase Function for secure and efficient data import.

## Style Guidelines:

- Primary color: A muted blue (#6699CC) to reflect trust and reliability in a professional setting.
- Background color: Light gray (#F0F0F0) to provide a clean, neutral backdrop for content.
- Accent color: A soft orange (#E59866) to highlight important actions and sections, contrasting gently with the primary color.
- Body and headline font: 'Inter' (sans-serif) for a modern, machined look that ensures readability and clarity across the platform.
- Use simple, outlined icons to maintain a clean and professional interface.
- Maintain a clean, intuitive dashboard layout to enable technicians to find information quickly
- Subtle transitions and animations to provide feedback on user interactions without being distracting.