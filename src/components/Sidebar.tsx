import React, { useState } from 'react';
import { Plus, Database, Settings, Moon, Sun, Edit2, Trash2, ChevronLeft, Menu, LogOut } from 'lucide-react';
import { useSession } from '../contexts/SessionContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import ConnectionModal from './ConnectionModal';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapsed }) => {
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingAlias, setEditingAlias] = useState('');
  
  const { 
    sessions, 
    currentSessionId, 
    switchSession, 
    deleteSession, 
    renameSession 
  } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();

  const handleStartEdit = (sessionId: string, currentAlias: string) => {
    setEditingSessionId(sessionId);
    setEditingAlias(currentAlias);
  };

  const handleSaveEdit = () => {
    if (editingSessionId && editingAlias.trim()) {
      renameSession(editingSessionId, editingAlias.trim());
    }
    setEditingSessionId(null);
    setEditingAlias('');
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingAlias('');
  };

  const handleDeleteSession = (sessionId: string, sessionAlias: string) => {
    if (confirm(`Are you sure you want to delete "${sessionAlias}"?`)) {
      deleteSession(sessionId);
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4">
          <button
            onClick={onToggleCollapsed}
            className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
        
        <div className="flex-1 px-4 py-2">
          <button
            onClick={() => setIsConnectionModalOpen(true)}
            className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-4"
            title="New Chat"
          >
            <Plus size={16} />
          </button>
          
          <div className="space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => switchSession(session.id)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title={session.alias}
              >
                <Database size={16} />
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
        
        <ConnectionModal
          isOpen={isConnectionModalOpen}
          onClose={() => setIsConnectionModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database size={24} className="text-blue-600 dark:text-blue-400" />
            DB Chat
          </h1>
          <button
            onClick={onToggleCollapsed}
            className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
        
        <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Welcome, <span className="font-medium text-gray-900 dark:text-white">{user?.name}</span>
          </p>
        </div>
        
        <button
          onClick={() => setIsConnectionModalOpen(true)}
          className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group relative rounded-lg transition-colors ${
                currentSessionId === session.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {editingSessionId === session.id ? (
                <div className="p-3">
                  <input
                    type="text"
                    value={editingAlias}
                    onChange={(e) => setEditingAlias(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    onBlur={handleSaveEdit}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => switchSession(session.id)}
                  className="w-full text-left p-3"
                >
                  <div className="flex items-start gap-2">
                    <Database size={16} className="text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {session.alias}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {session.history.length} messages
                      </div>
                    </div>
                  </div>
                </button>
              )}
              
              {editingSessionId !== session.id && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={() => handleStartEdit(session.id, session.alias)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Rename"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session.id, session.alias)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Database size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">No database connections yet.</p>
              <p className="text-xs mt-1">Click "New Chat" to get started.</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Settings size={16} />
            Appearance
          </button>
          
          {showSettings && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2">
              <button
                onClick={() => {
                  toggleTheme();
                  setShowSettings(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
              <hr className="my-1 border-gray-200 dark:border-gray-700" />
              <button
                onClick={() => {
                  signOut();
                  setShowSettings(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
      />
    </div>
  );
};

export default Sidebar;