import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, DatabaseConnection, ChatMessage } from '../types';

interface SessionContextType {
  sessions: Session[];
  currentSessionId: string | null;
  currentSession: Session | null;
  createSession: (connection: DatabaseConnection) => Promise<void>;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, newAlias: string) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  sendQuery: (sessionId: string, query: string) => Promise<void>;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
}

// Mock API functions
const mockConnectDB = async (connection: DatabaseConnection): Promise<Session> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const session: Session = {
    id: Date.now().toString(),
    dbUrl: connection.dbUrl,
    username: connection.username,
    alias: connection.alias || extractDBName(connection.dbUrl),
    history: [],
    isConnected: true,
    createdAt: new Date()
  };
  
  return session;
};

const mockQueryDB = async (sessionId: string, query: string): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock responses based on query keywords
  if (query.toLowerCase().includes('select')) {
    return `Query executed successfully. Found 15 records matching your criteria.
    
Sample results:
| ID | Name | Department | Salary |
|----|------|------------|---------|
| 1  | John Smith | Engineering | $75,000 |
| 2  | Jane Doe | Marketing | $68,000 |
| 3  | Bob Johnson | Sales | $62,000 |`;
  }
  
  if (query.toLowerCase().includes('create') || query.toLowerCase().includes('insert')) {
    return 'Operation completed successfully. 1 row affected.';
  }
  
  if (query.toLowerCase().includes('update')) {
    return 'Update completed successfully. 3 rows affected.';
  }
  
  if (query.toLowerCase().includes('delete')) {
    return 'Delete operation completed. 2 rows affected.';
  }
  
  return `Query processed: "${query}"\n\nThis is a mock response. The query would be executed against your connected database in a real environment.`;
};

const extractDBName = (dbUrl: string): string => {
  try {
    const parts = dbUrl.split('/');
    const dbName = parts[parts.length - 1];
    return dbName || 'Database';
  } catch {
    return 'Database';
  }
};

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('dbChatSessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      // Convert date strings back to Date objects
      const sessions = parsed.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        history: session.history.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      setSessions(sessions);
      if (sessions.length > 0) {
        setCurrentSessionId(sessions[0].id);
      }
    }
  }, []);

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    localStorage.setItem('dbChatSessions', JSON.stringify(sessions));
  }, [sessions]);

  const createSession = async (connection: DatabaseConnection) => {
    setIsLoading(true);
    try {
      const newSession = await mockConnectDB(connection);
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'system',
        text: `Successfully connected to ${newSession.alias}! You can now start querying your database using natural language.`,
        timestamp: new Date()
      };
      
      setSessions(prev => prev.map(session => 
        session.id === newSession.id 
          ? { ...session, history: [welcomeMessage] }
          : session
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      setCurrentSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
    }
  };

  const renameSession = (sessionId: string, newAlias: string) => {
    setSessions(prev => prev.map(session =>
      session.id === sessionId ? { ...session, alias: newAlias } : session
    ));
  };

  const addMessage = (sessionId: string, message: ChatMessage) => {
    setSessions(prev => prev.map(session =>
      session.id === sessionId
        ? { ...session, history: [...session.history, message] }
        : session
    ));
  };

  const sendQuery = async (sessionId: string, query: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date()
    };
    
    addMessage(sessionId, userMessage);
    setIsLoading(true);
    
    try {
      const response = await mockQueryDB(sessionId, query);
      const systemMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        text: response,
        timestamp: new Date()
      };
      addMessage(sessionId, systemMessage);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        text: 'Error executing query. Please check your connection and try again.',
        timestamp: new Date()
      };
      addMessage(sessionId, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SessionContext.Provider value={{
      sessions,
      currentSessionId,
      currentSession,
      createSession,
      switchSession,
      deleteSession,
      renameSession,
      addMessage,
      sendQuery,
      isLoading
    }}>
      {children}
    </SessionContext.Provider>
  );
};