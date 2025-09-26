import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader,
  Database,
  Bot,
  User,
  Download,
  NotepadText,
} from "lucide-react";
import { useSession } from "../contexts/SessionContext";
import { CSVLink } from "react-csv";
import html2canvas from "html2canvas";
import { useTheme } from "../contexts/ThemeContext";

// Component to render table data
// const TableRenderer: React.FC<{ data: any[] }> = ({ data }) => {
//   if (!data || data.length === 0) return null;

//   const columns = Object.keys(data[0]);

//   return (
//     <div className="overflow-x-auto mt-3">
//       <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
//         <thead className="bg-gray-50 dark:bg-gray-800">
//           <tr>
//             {columns.map((column) => (
//               <th
//                 key={column}
//                 className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700"
//               >
//                 {column.replace(/_/g, " ")}
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
//           {data.map((row, index) => (
//             <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
//               {columns.map((column) => (
//                 <td
//                   key={column}
//                   className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap"
//                 >
//                   {row[column]}
//                 </td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

const TableRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  if (!data || data.length === 0) return null;

  const rowsPerPage = 5; // you can make this configurable

  const columns = Object.keys(data[0]);

  // Pagination logic
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="overflow-x-auto mt-3">
      <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700"
              >
                {column.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {paginatedData.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              {columns.map((column) => (
                <td
                  key={column}
                  className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap"
                >
                  {row[column]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-3 text-sm text-gray-600 dark:text-gray-300">
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50 dark:border-gray-600"
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50 dark:border-gray-600"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

// Component to render message content with table support
const MessageContent: React.FC<{ text: string }> = ({ text }) => {
  const { theme } = useTheme();
  const tableRef = useRef<HTMLDivElement>(null);

  // Check if message contains table data
  const tableDataMatch = text.match(/\[TABLE_DATA\](.+)$/);
  const [showDropdown, setShowDropdown] = useState(false);
  if (tableDataMatch) {
    try {
      const tableData = JSON.parse(tableDataMatch[1]);
      const textWithoutTable = text.replace(/\[TABLE_DATA\].+$/, "").trim();

      const downloadPNG = async () => {
        if (!tableRef.current) return;
        const canvas = await html2canvas(tableRef.current);
        const link = document.createElement("a");
        link.download = "table.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      };

      return (
        <div className="relative">
          {/* Text above table */}
          <div className="whitespace-pre-wrap break-words mb-2">
            {textWithoutTable}
          </div>

          {/* Download button at top-right */}
          <div className="flex justify-end mb-1 relative">
            <Download onClick={() => setShowDropdown((prev) => !prev)} />

            {showDropdown && (
              <div
                className={`absolute right-0 top-full mt-1 border shadow-lg rounded z-10 ${
                  theme === "dark"
                    ? "bg-gray-800 text-white border-gray-700"
                    : "bg-white text-gray-900 border-gray-300"
                }`}
              >
                <ul>
                  <li>
                    <button
                      className={`w-full text-left px-4 py-2 hover:${
                        theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                      }`}
                      onClick={downloadPNG}
                    >
                      PNG
                    </button>
                  </li>
                  <li>
                    <CSVLink
                      data={tableData}
                      filename="table.csv"
                      className={`w-full block px-4 py-2 hover:${
                        theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                      }`}
                      onClick={() => setShowDropdown(false)}
                    >
                      CSV
                    </CSVLink>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Table */}
          <div ref={tableRef}>
            <TableRenderer data={tableData} />
          </div>
        </div>
      );
    } catch (error) {
      return (
        <div className="whitespace-pre-wrap break-words">
          {text.replace(/\[TABLE_DATA\].+$/, "")}
        </div>
      );
    }
  }

  return <div className="whitespace-pre-wrap break-words">{text}</div>;
};

const ChatArea: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSummary, setShowSummary] = useState(false);

  const { currentSession, sendQuery, isLoading } = useSession();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentSession || isLoading) return;

    const query = inputValue.trim();
    setInputValue("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await sendQuery(currentSession.id, query);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!currentSession) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="text-center">
          <Database
            size={64}
            className="mx-auto mb-4 text-gray-400 dark:text-gray-500"
          />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Database Connected
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Connect to a database to start querying with natural language.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-2">
          <Database size={20} className="text-blue-600 dark:text-blue-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {currentSession.alias}
          </h2>
          <div className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Connected
          </div>
          <button
            onClick={() => setShowSummary(true)}
            className="text-blue-600 hover:text-blue-900"
            title="Summary"
          >
            <NotepadText />
          </button>
        </div>
      </div>

      {/* Summary Popup */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button
              onClick={() => setShowSummary(false)}
              className="absolute top-3 right-3 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Session Summary
            </h3>
            <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {currentSession.summary}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {currentSession.history.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Bot size={48} className="mx-auto mb-4 opacity-50" />
            <p>Start a conversation with your database!</p>
            <p className="text-sm mt-2">
              Try asking: "Show me all users" or "What tables are available?"
            </p>
          </div>
        ) : (
          currentSession.history.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                {message.sender === "user" ? (
                  <User size={16} />
                ) : (
                  <Bot size={16} />
                )}
              </div>

              <div
                className={`flex-1 max-w-3xl ${
                  message.sender === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block p-4 rounded-lg ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <MessageContent text={message.text!} />
                </div>
                <div
                  className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                    message.sender === "user" ? "text-right" : "text-left"
                  }`}
                >
                  {/* {message.timestamp.toLocaleDateString()} */}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <Bot size={16} className="text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1 max-w-3xl">
              <div className="inline-block p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Loader size={16} className="animate-spin" />
                  Executing query...
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask your database anything..."
              rows={1}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none min-h-[52px] max-h-[120px]"
              style={{ height: "auto" }}
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Send size={20} />
          </button>
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatArea;
