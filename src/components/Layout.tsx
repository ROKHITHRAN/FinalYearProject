import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';

const Layout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-gray-900">
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <ChatArea />
    </div>
  );
};

export default Layout;