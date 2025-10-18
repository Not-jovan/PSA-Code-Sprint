import React, { useState } from "react";

export interface TabProps {
  label: string;
  children: React.ReactNode;
}

/** Dumb container so TS knows `label` exists */
export const Tab: React.FC<TabProps> = ({ children }) => <>{children}</>;

interface NavTabsProps {
  children: React.ReactElement<TabProps> | React.ReactElement<TabProps>[];
}

const NavTabs: React.FC<NavTabsProps> = ({ children }) => {
  const childArray = React.Children.toArray(children) as React.ReactElement<TabProps>[];
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col">
      <ul className="flex border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        {childArray.map((child, idx) => (
          <li
            key={child.props.label}
            onClick={() => setActive(idx)}
            className={`px-4 py-2 cursor-pointer ${
              idx === active
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {child.props.label}
          </li>
        ))}
      </ul>
      <div className="p-4">{childArray[active]?.props.children}</div>
    </div>
  );
};

export default NavTabs;
