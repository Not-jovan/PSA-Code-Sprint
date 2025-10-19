import React, { useEffect, useState, useCallback } from "react";
import { loadEmployeesJson, loadSkillsXlsx, indexSkills, annotateEmployeeSkills } from "./utils/dataLoader";
import DarkModeToggle from "./components/DarkModeToggle";
import Login from "./components/Login";
import NavTabs, { Tab } from "./components/NavTabs";
import ProfilesTab from "./components/ProfilesTab";
import CareerDevTab from "./components/CareerDevTab";
import ChatbotWidget from "./components/ChatbotWidget";
import Feedback from "./components/Feedback";

import type { EmployeeProfile } from "./validation/schemas";

const App = () => {
  /** THEME MANAGEMENT **/
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (stored) return stored === "dark";
    if (typeof window !== "undefined") {
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);


  /** AUTHENTICATION **/
  const [currentUser, setCurrentUser] = useState<EmployeeProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const sharedPassword = "password"; // Temporary shared password

  const handleLogin = useCallback(
    (employeeId: string, password: string) => {
      console.log("Attempting login with:", { employeeId, password });
      console.log("Loaded employees:", employees);

      if (!employees || employees.length === 0) {
        console.error("Employees data is not loaded.");
        return false;
      }

      const employee = employees.find((e) => e.employee_id === employeeId);
      console.log("Matched employee:", employee);

      if (!employee) {
        console.error("Employee ID not found.");
        return false;
      }

      if (password !== sharedPassword) {
        console.error("Incorrect password.");
        return false;
      }

      setCurrentUser(employee);
      console.log("Login successful:", employee);
      return true;
    },
    [employees]
  );

  const handleLogout = () => setCurrentUser(null);

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
      <Login onLogin={handleLogin} />
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
          Welcome, <strong>{currentUser.personal_info.name}</strong> (Employee)
        </span>
        <DarkModeToggle enabled={darkMode} toggle={() => setDarkMode((v) => !v)} />
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
        <Feedback />
      </Tab>
    </NavTabs>


    {/* Chatbot */}
    <ChatbotWidget />


  </div>
);
};


export default App;