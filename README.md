# Stroke Recovery & Connection Hub

This project is a web-based companion platform for the Stroke Memory App, designed to bridge the communication gap between stroke survivors (patients) and their caregivers or family (companions). Built with React and powered by a robust Appwrite backend, this application provides a centralized hub for support, monitoring, and real-time communication.

---

## 💡 The Inspiration

The journey to recovery after a stroke is a profound challenge, not just for the survivor but for their entire support system. Patients often grapple with memory loss and cognitive difficulties, while caregivers face the emotional and logistical burden of providing constant support. A critical challenge is maintaining a seamless flow of information and emotional connection, which can be fragmented across various messaging apps, phone calls, and calendars.

Our Stroke Recovery & Connection Hub was born from a desire to solve this problem. We envision a world where a caregiver can be hundreds of miles away but still feel deeply connected to their loved one's recovery journey. This app is more than just a tool; it's a lifeline designed to reduce anxiety, foster encouragement, and provide a shared space for the recovery process.

---

## ✨ How It Works: Features

The platform provides a secure, role-based experience for both patients (on a mobile app) and their companions (on this web app).

### 1. Secure User Authentication & Connection
- **Role-Based Accounts:** Users can register as either a patient or a companion, with a secure login system powered by **Appwrite Authentication**.
- **Privacy-First Connection System:** A patient can view their unique, private `shareable_id` from their dashboard. They can share this ID with a trusted companion. The companion can then enter this ID on their dashboard to create a secure link between their accounts. This process, managed by **Appwrite Databases** with strict permissions, ensures that a patient's sensitive data is only shared with their explicit consent.

### 2. The Companion Dashboard: A Central Hub for Support
Once connected, the companion gains access to a comprehensive dashboard with read-only views of the patient's data:

- **At-a-Glance Progress Monitoring:** The dashboard displays the patient's most recent **memory and cognition scores**, offering caregivers valuable insight into their recovery progress.
- **Shared Journal Entries:** Caregivers can read the patient's journal entries, providing a window into their thoughts, feelings, and daily experiences. This fosters empathy and helps the caregiver provide more targeted emotional support.
- **Upcoming Reminders:** The dashboard lists the patient's upcoming reminders—for medication, appointments, or therapy exercises—allowing the caregiver to stay informed and offer timely encouragement.

### 3. Real-time Communication
- **Integrated Messaging:** A core feature of the hub is the real-time chat, powered by **Appwrite's Realtime Service**. A companion can select a connected patient and engage in a seamless, private conversation directly within the app, eliminating the need for external messaging platforms.

---

## 🛠️ Tech Stack: How We Built It

- **Frontend:**
  - **React:** For building a dynamic and responsive user interface.
  - **Vite:** As the next-generation frontend tooling for a blazing-fast development experience.
  - **Tailwind CSS:** For creating a modern, utility-first, and visually consistent design.

- **Backend (Appwrite Cloud):**
  - **Appwrite Authentication:** Manages all user sign-ups, logins, and secure sessions.
  - **Appwrite Databases:** The backbone of our application. We use multiple collections with carefully configured permissions to store all data:
    - `users`: Stores user profiles and `shareable_id`s.
    - `user_relationships`: Securely links companions to patients.
    - `progress_table`, `journal_table`, `reminders_table`: Store patient-generated data, with read access granted only to linked companions.
    - `messages_table`: Stores chat messages with permissions ensuring only the sender and receiver can read them.
  - **Appwrite Realtime:** Powers the instant messaging feature, allowing for live updates and communication without needing to refresh the page.
