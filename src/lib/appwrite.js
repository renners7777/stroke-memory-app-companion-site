import { Client, Account, Databases, ID, Query, Permission, Role } from "appwrite";

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);

// EXPORTING THE CLIENT IS THE FIX for the J.subscribe error and blank screen
export { client, ID, Query, Permission, Role };
