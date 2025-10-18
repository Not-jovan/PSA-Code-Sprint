import React from 'react';

interface Props {
  enabled: boolean;
  toggle: () => void;
}

const DarkModeToggle: React.FC<Props> = ({ enabled, toggle }) => (
  <button
    onClick={toggle}
    className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm font-medium shadow hover:bg-gray-300 dark:hover:bg-gray-600"
    aria-label="Toggle dark mode"
  >
    {enabled ? '🌙 Dark Mode' : '☀️ Light Mode'}
  </button>
);

export default DarkModeToggle;