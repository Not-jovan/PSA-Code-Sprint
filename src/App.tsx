import React, { useEffect, useState, useCallback } from "react";
import { loadEmployeesJson, loadSkillsXlsx, indexSkills, annotateEmployeeSkills } from "./utils/dataLoader";
import DarkModeToggle from "./components/DarkModeToggle";
import Login from "./components/Login";
import NavTabs, { Tab } from "./components/NavTabs";
import ProfilesTab from "./components/ProfilesTab";
import CareerDevTab from "./components/CareerDevTab";
import ChatbotWidget from "./components/ChatbotWidget";
import Feedback from "./components/Feedback";
import LeadershipPotential from "./components/LeadershipPotential";
import type { EmployeeProfile } from "./validation/schemas";

const App = () => {
  /** THEME MANAGEMENT **/
  const [darkMode, setDarkMode] = useState(false); // Centralized dark mode state
  const toggleDarkMode = () => setDarkMode((prev) => !prev); // Toggle function

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);


  /** AUTHENTICATION **/
  const [currentUser, setCurrentUser] = useState<EmployeeProfile | null>(() => {
  const saved = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
  return saved ? JSON.parse(saved) : null;
});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const handleLogin = useCallback(async (username: string, password: string): Promise<boolean> => {
   try {
     const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
     });   
     if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
       console.error(`Login failed for ${username}: ${errorData.error || 'Server error'}.`);
       return false;
     }

     const data = await res.json();

   setCurrentUser({
  employee_id: data.username,
  personal_info: { name: data.name },
  isadmin: data.isadmin
} as EmployeeProfile);

localStorage.setItem("currentUser", JSON.stringify({
  employee_id: data.username,
  personal_info: { name: data.name },
  isadmin: data.isadmin
}));

   return true;
  
   } catch (error) {
     console.error("Network or parsing error during login:", error);
     return false;
   }
 }, []);

  const handleLogout = () => {
  setCurrentUser(null);
  localStorage.removeItem("currentUser");
};

  /** EMPLOYEES + SKILLS DATA **/

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        setDataError(null);

        // In App.tsx fetchData:
        const saved = localStorage.getItem("employeesData");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            // If data is an array of EmployeeProfile and seems complete, use it
            if (Array.isArray(parsed) && parsed.length === 5) {
              setEmployees(parsed);
              setDataLoading(false);
              return;
            } else {
              console.warn("Incomplete data in localStorage, loading fresh data.");
            }
          } catch {
            console.warn("Invalid data in localStorage, falling back to fresh load.");
          }
        }

        // Fresh load from public/data
      const employeesValidated = await loadEmployeesJson("/Data/employees.json");
      const skillsFile = encodeURI("/Data/Functions_Skills.xlsx");
      const skillsRows = await loadSkillsXlsx(skillsFile);
      const skillsIndex = indexSkills(skillsRows);
      const enrichedEmployees = annotateEmployeeSkills(employeesValidated, skillsIndex);

      // Save to localStorage for future use
      localStorage.setItem("employeesData", JSON.stringify(enrichedEmployees));

      // Update state
      setEmployees(enrichedEmployees);
    } catch (error) {
      console.error("Error loading data:", error);
      setDataError("Failed to load employees or skills data.");
    } finally {
      setDataLoading(false);
    }
  };

  fetchData();
}, []);

// Persist edits to localStorage whenever employees state changes
useEffect(() => {
  if (employees.length) {
    localStorage.setItem("employeesData", JSON.stringify(employees));
  }
}, [employees]);

/** RENDER: Login first */
if (!currentUser) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 gap-3 p-4">
      {dataLoading && <div className="text-sm opacity-80">Loading employees…</div>}
      {dataError && (
        <div className="text-sm bg-red-600 text-white rounded px-3 py-2">{dataError}</div>
      )}
      <Login
      onLogin={(username, password) => {
    handleLogin(username, password).then((success) => {
      if (!success) alert("Login failed");
    });
    return true; // Return something synchronously to satisfy TS (ignored)
  }}
/>
    </div>
  );
}

/** RENDER: App */
return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col">
    {/* Header */}
    <header className="w-full flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 shadow">
      <h1 className="text-xl font-semibold">Career Pathway Portal</h1>
      <div className="flex items-center gap-3">
        <span>
  Welcome,{" "}
  <strong>
    {currentUser.personal_info?.name || currentUser.employee_id}
    {currentUser.isadmin === 1 && <span className="text-blue-600"> (Admin)</span>}
  </strong>
</span>

        <DarkModeToggle enabled={darkMode} toggle={toggleDarkMode} />
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
        >
          Logout
        </button>
      </div>
    </header>

    {/* Alerts */}
    {dataLoading && <div className="p-3 text-sm">Loading employee & skills data…</div>}
    {dataError && (
      <div className="p-3 text-sm bg-yellow-500/20 text-yellow-200 dark:text-yellow-100">
        {dataError}
      </div>
    )}

    {/* Tabs */}
    <NavTabs>
      <Tab label="Profiles">
        <ProfilesTab
          user={currentUser}
          employees={employees}
          onUpdateProfile={(updated) => {
            setEmployees((prev) =>
              prev.map((e) => (e.employee_id === updated.employee_id ? updated : e))
            );
          }}
        />
      </Tab>

      <Tab label="Career Development">
        <CareerDevTab user={currentUser} employees={employees} />
      </Tab>

      <Tab label="Feedback">
        <Feedback darkMode={darkMode}/>
      </Tab>
      <Tab label="Leadership Potential">
        <LeadershipPotential/>
      </Tab>

    </NavTabs>


    {/* Chatbot */}
    <ChatbotWidget />


  </div>
);
};


export default App;