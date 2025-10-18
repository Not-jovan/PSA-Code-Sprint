import React, { useEffect, useState, useCallback } from "react";
import { loadEmployeesJson, loadSkillsCsv, indexSkills, annotateEmployeeSkills } from "./utils/dataLoader";
import Login from "./components/Login";
import type { EmployeeProfile } from "./validation/schemas";

const App = () => {
  /** THEME MANAGEMENT **/
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
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

        // Try loading employees from localStorage
        const saved = typeof window !== "undefined" ? localStorage.getItem("employeesData") : null;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setEmployees(parsed);
            setDataLoading(false);
            return;
          } catch (err) {
            console.warn("Invalid data in localStorage, falling back to fresh load.");
          }
        }

        // Fresh load from public/data
        const employeesValidated = await loadEmployeesJson("/Data/employees.json");
        const skillsRows = await loadSkillsCsv("/Data/Functions & Skills.csv");
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
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-grow p-4">
        {/* Add your main app content here */}
      </main>
    </div>
  );
};

export default App;