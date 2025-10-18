import React, { useState } from 'react';
import { EmployeeProfile } from "../validation/schemas";


interface Props {
  originalData: EmployeeProfile;
  onSave: (profile: EmployeeProfile) => void;
  onCancel: () => void;
}


const ProfileForm: React.FC<Props> = ({ originalData, onSave, onCancel }) => {
  const [name, setName] = useState(originalData.personal_info.name);
  const [email, setEmail] = useState(originalData.personal_info.email);
  const [office, setOffice] = useState(originalData.personal_info.office_location);
  const [jobTitle, setJobTitle] = useState(originalData.employment_info.job_title);
  const [department, setDepartment] = useState(originalData.employment_info.department);


  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: EmployeeProfile = {
      ...originalData,
      personal_info: { ...originalData.personal_info, name, email, office_location: office },
      employment_info: {
        ...originalData.employment_info,
        job_title: jobTitle,
        department,
        last_updated: new Date().toISOString().split('T')[0]
      }
    };
    onSave(updated);
  };


  return (
    <form onSubmit={submit} className="p-4 border rounded bg-gray-50 dark:bg-gray-800 text-sm">
      <h3 className="text-lg font-semibold mb-3">Edit Profile</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <label className="block">
          <span className="block text-sm mb-1">Name</span>
          <input className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-700" value={name} onChange={e => setName(e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Email</span>
          <input type="email" className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-700" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Office Location</span>
          <input className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-700" value={office} onChange={e => setOffice(e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Job Title</span>
          <input className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-700" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-sm mb-1">Department</span>
          <input className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-700" value={department} onChange={e => setDepartment(e.target.value)} />
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-1 bg-gray-300 dark:bg-gray-700 rounded">Cancel</button>
        <button type="submit" className="px-4 py-1 bg-green-600 text-white rounded">Save</button>
      </div>
    </form>
  );
};


export default ProfileForm;