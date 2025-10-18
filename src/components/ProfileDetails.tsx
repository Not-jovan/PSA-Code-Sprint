import React, { useState } from 'react';
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