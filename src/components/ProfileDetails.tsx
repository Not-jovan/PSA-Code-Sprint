/*import React, { useState } from 'react';
import ProfileForm from './ProfileForm';
import { EmployeeProfile } from "../validation/schemas";


interface Props {
  employee: EmployeeProfile;
  allowEdit: boolean;
  onUpdate: (profile: EmployeeProfile) => void;
}


const ProfileDetails: React.FC<Props> = ({ employee, allowEdit, onUpdate }) => {
  const [editing, setEditing] = useState(false);


  const handleSave = (updated: EmployeeProfile) => {
    onUpdate(updated);
    setEditing(false);
  };


  if (editing) {
    return <ProfileForm originalData={employee} onSave={handleSave} onCancel={() => setEditing(false)} />;
  }


  const p = employee.personal_info;
  const e = employee.employment_info;


  return (
    <div className="text-sm">
      {allowEdit && (
        <div className="text-right">
          <button onClick={() => setEditing(true)} className="mb-2 px-3 py-1 bg-blue-600 text-white text-xs rounded">Edit Profile</button>
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{p.name} – {e.job_title}</h3>
      <div className="mb-4">
        <h4 className="font-medium">Personal Info</h4>
        <p><strong>Email:</strong> {p.email}</p>
        <p><strong>Office:</strong> {p.office_location}</p>
        <p><strong>Languages:</strong> {p.languages.map(l => `${l.language} (${l.proficiency})`).join('; ')}</p>
      </div>
      <div className="mb-4">
        <h4 className="font-medium">Employment</h4>
        <p><strong>Department:</strong> {e.department} – {e.unit}</p>
        <p><strong>Line Manager:</strong> {e.line_manager}</p>
        <p><strong>In Current Role Since:</strong> {e.in_role_since}</p>
        <p><strong>Hire Date:</strong> {e.hire_date}</p>
        <p><strong>Last Profile Update:</strong> {e.last_updated}</p>
      </div>
      {employee.skills && (
        <div className="mb-4">
          <h4 className="font-medium">Skills</h4>
          <ul className="list-disc list-inside">
            {employee.skills.map((s, idx) => (
              <li key={idx}>{s.skill_name} <em className="text-gray-500">({s.specialization})</em></li>
            ))}
          </ul>
        </div>
      )}
      {employee.competencies && (
        <div className="mb-4">
          <h4 className="font-medium">Competencies</h4>
          <ul className="list-disc list-inside">
            {employee.competencies.map((c, idx) => (
              <li key={idx}>{c.name} – <span className="italic">{c.level}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


export default ProfileDetails;
*/

import React, { useEffect, useState } from "react";
import ProfileForm from "./ProfileForm";
import { EmployeeProfile } from "../validation/schemas";

interface Props {
  employee: EmployeeProfile;
  allowEdit: boolean;
  onUpdate: (profile: EmployeeProfile) => void;
}

type TabId = "personal" | "employment" | "skills" | "competencies";

// Tabs config (no hook needed)
const TAB_LIST: { id: TabId; label: string }[] = [
  { id: "personal", label: "Personal Info" },
  { id: "employment", label: "Employment" },
  { id: "skills", label: "Skills" },
  { id: "competencies", label: "Competencies" },
];

const ProfileDetails: React.FC<Props> = ({ employee, allowEdit, onUpdate }) => {
  const [editing, setEditing] = useState(false);

  // --- Tab state, synced with URL hash (e.g., #skills) ---
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window === "undefined") return "personal";
    const hash = (window.location.hash.replace("#", "") || "personal") as TabId;
    return (["personal", "employment", "skills", "competencies"] as const).includes(hash)
      ? hash
      : "personal";
  });

  useEffect(() => {
    const onHashChange = () => {
      const raw = (window.location.hash.replace("#", "") || "personal") as TabId;
      if ((["personal", "employment", "skills", "competencies"] as const).includes(raw)) {
        setActiveTab(raw);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const switchTab = (tab: TabId) => {
    setActiveTab(tab);
    if (typeof window !== "undefined" && window.location.hash !== `#${tab}`) {
      history.replaceState(null, "", `#${tab}`);
    }
  };

  const handleSave = (updated: EmployeeProfile) => {
    onUpdate(updated);
    setEditing(false);
  };

  // ---- Early return AFTER all hooks are declared (safe) ----
  if (editing) {
    return (
      <ProfileForm
        originalData={employee}
        onSave={handleSave}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const p = employee.personal_info;
  const e = employee.employment_info;

  return (
    <div className="text-sm">
      {allowEdit && (
        <div className="text-right">
          <button
            onClick={() => setEditing(true)}
            className="mb-4 px-3 py-1 bg-blue-600 text-white text-xs rounded"
          >
            Edit Profile
          </button>
        </div>
      )}

      <h3 className="text-lg font-semibold mb-3">
        {p.name} – {e.job_title}
      </h3>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TAB_LIST.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={[
                "px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200",
                active
                  ? "bg-blue-100 text-blue-700 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-100 border-b-2 border-transparent",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Card container for tab content */}
      <div className="mt-4 p-5 bg-white rounded-xl shadow-sm border border-gray-100">
        {activeTab === "personal" && (
          <section>
            <h4 className="text-base font-semibold mb-3 text-gray-800">Personal Info</h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-gray-700">
              <div>
                <dt className="font-medium">Email:</dt>
                <dd className="text-gray-600 break-all">{p.email}</dd>
              </div>
              <div>
                <dt className="font-medium">Office:</dt>
                <dd className="text-gray-600">{p.office_location}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-medium">Languages:</dt>
                <dd className="text-gray-600">
                  {p.languages.map((l) => `${l.language} (${l.proficiency})`).join("; ")}
                </dd>
              </div>
            </dl>
          </section>
        )}

        {activeTab === "employment" && (
          <section>
            <h4 className="text-base font-semibold mb-3 text-gray-800">Employment</h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-gray-700">
              <div>
                <dt className="font-medium">Department:</dt>
                <dd className="text-gray-600">
                  {e.department} – {e.unit}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Line Manager:</dt>
                <dd className="text-gray-600">{e.line_manager}</dd>
              </div>
              <div>
                <dt className="font-medium">In Current Role Since:</dt>
                <dd className="text-gray-600">{e.in_role_since}</dd>
              </div>
              <div>
                <dt className="font-medium">Hire Date:</dt>
                <dd className="text-gray-600">{e.hire_date}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-medium">Last Profile Update:</dt>
                <dd className="text-gray-600">{e.last_updated}</dd>
              </div>
            </dl>
          </section>
        )}

        {activeTab === "skills" && (
          <section>
            <h4 className="text-base font-semibold mb-3 text-gray-800">Skills</h4>
            {employee.skills?.length ? (
              <ul className="divide-y divide-gray-100">
                {employee.skills.map((s, idx) => (
                  <li key={idx} className="py-2">
                    <span className="font-medium text-gray-800">{s.skill_name}</span>
                    {s.specialization && (
                      <span className="text-gray-500"> — {s.specialization}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No skills listed.</p>
            )}
          </section>
        )}

        {activeTab === "competencies" && (
          <section>
            <h4 className="text-base font-semibold mb-3 text-gray-800">Competencies</h4>
            {employee.competencies?.length ? (
              <ul className="divide-y divide-gray-100">
                {employee.competencies.map((c, idx) => (
                  <li key={idx} className="py-2">
                    <span className="font-medium text-gray-800">{c.name}</span>
                    <span className="text-gray-500"> — {c.level}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No competencies listed.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default ProfileDetails;
