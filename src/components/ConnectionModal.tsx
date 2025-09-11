import React, { useState } from 'react';
import { Database, Loader } from 'lucide-react';
import { DatabaseConnection } from '../types';
import { useSession } from '../contexts/SessionContext';
import Modal from './Modal';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<DatabaseConnection>({
    dbUrl: '',
    username: '',
    password: '',
    alias: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { createSession, isLoading } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.dbUrl.trim()) newErrors.dbUrl = 'Database URL is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      try {
        await createSession(formData);
        onClose();
        setFormData({ dbUrl: '', username: '', password: '', alias: '' });
        setErrors({});
      } catch (error) {
        setErrors({ general: 'Failed to connect to database' });
      }
    }
  };

  const handleInputChange = (field: keyof DatabaseConnection, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect to Database">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Database className="text-blue-600 dark:text-blue-400" size={24} />
          <p className="text-gray-600 dark:text-gray-400">
            Enter your database connection details to start a new chat session.
          </p>
        </div>
        
        {errors.general && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
            {errors.general}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Database URL *
          </label>
          <input
            type="text"
            value={formData.dbUrl}
            onChange={(e) => handleInputChange('dbUrl', e.target.value)}
            placeholder="e.g., jdbc:mysql://localhost:3306/employees"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
              errors.dbUrl ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.dbUrl && (
            <p className="text-red-500 text-sm mt-1">{errors.dbUrl}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Username *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder="Database username"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
              errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">{errors.username}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password *
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Database password"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
              errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Alias (optional)
          </label>
          <input
            type="text"
            value={formData.alias}
            onChange={(e) => handleInputChange('alias', e.target.value)}
            placeholder="Give this connection a friendly name"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader size={16} className="animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ConnectionModal;