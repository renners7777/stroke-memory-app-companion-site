# Stroke Recovery Hub

The Stroke Recovery Hub is a web application designed to support stroke survivors and their caregivers on the path to recovery. It provides tools for medication reminders, a daily journal for tracking progress, and a secure messaging system to facilitate communication and support between a patient and their designated companion.

## Features

- **Role-Based Accounts:** Users can register as either a "Patient" or a "Companion/Caregiver," each with a tailored dashboard experience.
- **Secure Patient-Companion Connection:** Companions can connect to a patient's profile using a unique, shareable ID.
- **Medication Reminders:** Patients and their connected companions can set, view, and manage medication reminders.
- **Daily Journal:** Patients can maintain a private journal to log their progress, thoughts, and challenges. Companions can view these entries to stay informed.
- **Real-Time Chat:** A secure, one-to-one chat allows for instant communication and support.

## How to Run Locally

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) (usually included with Node.js)
- A local or cloud-hosted [Appwrite](https://appwrite.io/) instance (v1.5 or later)

---

### **1. Backend Setup (Appwrite Console)**

Before running the frontend, you must configure the Appwrite backend.

#### **A. Create a New Project**

1.  Log in to your Appwrite Console.
2.  Click **"Create project"** and give it a name (e.g., "Stroke Recovery Hub").
3.  Copy the **Project ID** from the project's settings page. You will need this later.
4.  Under "Platforms," add a **Web App** platform. Use `localhost` for the hostname during local development.

#### **B. Create Database & Collections**

1.  Navigate to **Databases** and create a new database. Give it a name and copy its **Database ID**.
2.  Create the following collections within that database, along with their required attributes and indexes.

    <details>
    <summary><strong>Collection: `users`</strong></summary>

    - **Attributes:**
        - `name`: String, Size: 128, **Required**
        - `email`: Email, Size: 128, **Required**
        - `shareable_id`: String, Size: 10, **Required**
        - `role`: String, Size: 20, **Required**
    - **Indexes:**
        - `shareable_id_and_role_index`: Type: `key`, Attributes: `shareable_id` (ASC), `role` (ASC)
    - **Settings (Permissions):**
        - Add Role: `Users`, with **Create** and **Read** access.
    </details>

    <details>
    <summary><strong>Collection: `user_relationships`</strong></summary>

    - **Attributes:**
        - `patient_id`: String, Size: 128, **Required**
        - `companion_id`: String, Size: 128, **Required**
    - **Indexes:**
        - `patient_id_index`: Type: `key`, Attributes: `patient_id` (ASC)
        - `companion_id_index`: Type: `key`, Attributes: `companion_id` (ASC)
    </details>

    <details>
    <summary><strong>Collection: `reminders_table`</strong></summary>

    - **Attributes:**
        - `userID`: String, Size: 128, **Required**
        - `title`: String, Size: 255, **Required**
        - `time`: Datetime, **Required**
        - `is_completed`: Boolean, Default value: `false`
    - **Indexes:**
        - `userID_index`: Type: `key`, Attributes: `userID` (ASC)
    </details>

    <details>
    <summary><strong>Collection: `journal_table`</strong></summary>

    - **Attributes:**
        - `userID`: String, Size: 128, **Required**
        - `content`: String, Size: 10000, **Required**
    - **Indexes:**
        - `userID_index`: Type: `key`, Attributes: `userID` (ASC)
    </details>

    <details>
    <summary><strong>Collection: `chat_messages`</strong></summary>

    - **Attributes:**
        - `relationship_id`: String, Size: 128, **Required**
        - `sender_id`: String, Size: 128, **Required**
        - `content`: String, Size: 10000, **Required**
    - **Indexes:**
        - `relationship_id_index`: Type: `key`, Attributes: `relationship_id` (ASC)
    </details>

---

### **2. Frontend Setup (Local Machine)**

1.  **Clone the Repository**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Create Environment File**
    - Create a new file named `.env.local` in the root of the project folder.
    - Add your Appwrite project details to this file:

    ```
    VITE_APPWRITE_PROJECT_ID=<YOUR_PROJECT_ID>
    VITE_APPWRITE_DATABASE_ID=<YOUR_DATABASE_ID>
    VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
    ```
    *(Replace `<...>` with the IDs you copied earlier. Use the default endpoint if using Appwrite Cloud).*

3.  **Install Dependencies**
    ```bash
    npm install
    ```

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```

5.  Open your browser and navigate to `http://localhost:5173` (or the address provided by Vite). You should now be able to register new accounts and use the application.
