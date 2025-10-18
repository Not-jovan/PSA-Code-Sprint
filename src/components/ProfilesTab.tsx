import React, { useState } from 'react';
import ProfileDetails from './ProfileDetails';
import { EmployeeProfile } from "../validation/schemas";

interface Props {
  user: EmployeeProfile; // Updated to use EmployeeProfile directly
  employees: EmployeeProfile[];
  onUpdateProfile: (profile: EmployeeProfile) => void;
}

const ProfilesTab: React.FC<Props> = ({ user, employees, onUpdateProfile }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Find the selected employee based on the selected ID
  const selected = selectedId ? employees.find(e => e.employee_id === selectedId) ?? null : null;

  // If the user is an employee, show their profile
  if (user.employee_id) {
    const myProfile = employees.find(e => e.employee_id === user.employee_id);
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">My Profile</h2>
        {myProfile ? (
          <ProfileDetails employee={myProfile} allowEdit onUpdate={onUpdateProfile} />
        ) : (
          <p className="text-gray-600">Profile data not found.</p>
        )}
      </div>
    );
  }

  // If the user is a manager, show the list of employees
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4">
      {/* Sidebar: List of Employees */}
      <aside className="w-full md:w-1/4 bg-gray-100 dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Employees</h2>
        <ul className="space-y-2">
          {employees.map(e => (
            <li
              key={e.employee_id}
              onClick={() => setSelectedId(e.employee_id)}
              className={`p-2 rounded cursor-pointer ${
                e.employee_id === selectedId
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {e.personal_info.name}
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Section: Selected Employee Details */}
      <section className="w-full md:w-3/4 bg-white dark:bg-gray-900 p-4 rounded shadow">
        {selected ? (
          <ProfileDetails employee={selected} allowEdit={false} onUpdate={onUpdateProfile} />
        ) : (
          <p className="text-gray-600">Select an employee to view their profile.</p>
        )}
      </section>
    </div>
  );
};

export default ProfilesTab;