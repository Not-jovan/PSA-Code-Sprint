# PSA-Code-Sprint - Employee Career Portal

This project is an employee career portal that includes a React-based frontend and a Flask-based backend. It provides features such as leadership potential scoring, chat functionality, and employee data management.

---

## **Table of Contents**
1. [Prerequisites](#prerequisites)
2. [Setup Instructions](#setup-instructions)
   - [1. Clone the Repository](#1-clone-the-repository)
   - [2. Install Dependencies](#2-install-dependencies)
3. [Starting the Servers](#starting-the-servers)
4. [Database Initialization](#database-initialization)
5. [Troubleshooting](#troubleshooting)

---

## **Prerequisites**
Before you begin, ensure you have the following installed on your system:
- **Python 3.8 or higher**
- **Node.js 16 or higher**
- **pnpm** (Package Manager for Node.js)
- **SQLite** (for the backend database)

1. [NodeJS and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
1. Install [pnpm](https://pnpm.io/installation) (It's essentially `npm` but faster).
1. Check if you have git installed, if not, install [git](https://git-scm.com/downloads) 
1. Make sure to link your Github account to your local git installation. See (`https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent`)
1. Clone this repository by running `git clone git@github.com:Not-jovan/PSA-Code-Sprint.git`.

---

## **Setup Instructions**

### **1. Clone the Repository**
    ```shell
    git clone <gh repo clone Not-jovan/PSA-Code-Sprint>
    cd PSA-Code-Sprint
    ```

### **2. Install dependencies

#### **Backend Dependencies**
## Setup

**NOTE:** File paths are relative to this `/PSA-Code-Sprint` folder.

1. Copy `./.example.env` and paste it in a new file `./.env`.
2. Run `pnpm i` to install the dependencies. Make sure you are in this working directory in your CLI.
3. Run  `pip install -r requirements.txt` to install the python packages. 
4. Setup `.env`.


---

## **Starting the Servers**
### **1. Start the Backend Server**
1. Ensure you are in the `server` directory.
2. Run the Flask development server:
    ```
    python3 app.py
    ```
3. The backend server should now be running at `http://localhost:8080`.

### **2. Start the Frontend Server**
1. Navigate to the `root` directory:
    ```
    cd ..
    
2. Start the React development server:
    ```
    pnpm start
    ```
3. The frontend server should now be running at `http://localhost:3000`.

```
```
## **Database Initialization**
1. Navigate to the `db` directory:
    ```
    cd db
    ```
2. Run the database initialization script:
    ```
    python3 init.py
    ```
3. This will create the SQLite database and populate it with the necessary tables.

---
## **Troubleshooting**

### **Common Issues**
1. **Environment Variables Not Set**:
    - Ensure you have copied `.env.example` to `.env` and filled in the required values.

2. **Backend Server Fails to Start**:
    - Ensure all Python dependencies are installed by typing:
    ```
    pip install -r requirements.txt
    ```


3. **Frontend Server Fails to Start**:
    - Verify that `pnpm` is installed and dependencies are correctly installed.
    - install `pnpm` globally by typing:
    ```
    npm install -g pnpm
    ```

4. **Database Issues**:
    - Ensure the `init.py` script has been run successfully.

---

**Project Structure**
```shell
employee-career-portal/
├── db/
│   ├── init.py         # Database initialization script
│   ├── auth.db         
├── public/
│   ├── data/            # Static data files
│       ├── employees.json
│       ├── Functions_Skills.json
├── server/
│   ├── app.py           # Flask backend server
│   ├── leadership.py    # Leadership-related endpoints
│   ├── requirements.txt # Python dependencies
├── src/
│   ├── components/      # React components
│       ├── CareerDevTab.tsx
│       ├── ChatbotWidget.tsx
│       ├── DarkModeToggle.tsx
│       ├── Feedback.tsx
│       ├── LeadershipPotential.tsx
│       ├── Login.tsx
│       ├── NavTabs.tsx
│       ├── ProfileDetails.tsx
│       ├── ProfileForm.tsx
│       ├── ProfilesTab.tsx
│   ├── utils/      # utility components
│   ├── validation/      # Schema
│   ├── App.tsx          # Main React app
│   ├── index.tsx
│   ├── main.tsx
├── package.json         # Node.js dependencies
├── package.json         # Node.js dependencies
├── README.md            # Project documentation
├── example.env          # example of .env file
```
---

## **License**
This project is licensed under the [MIT License](LICENSE).