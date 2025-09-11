// utils/connectionManager.js
const connections = {};
const schemas = {};

function saveConnection(username, pool) {
  connections[username] = pool;
}

function getConnection(username) {
  return connections[username];
}

function closeConnection(username) {
  if (connections[username]) {
    connections[username].end();
    delete connections[username];
  }
}

// Save schema for a user+database
function saveSchema(dbname, schema) {
  schemas[dbname] = schema;
}

function getSchema(dbname) {
  return schemas[dbname];
}

module.exports = {
  saveConnection,
  getConnection,
  closeConnection,
  saveSchema,
  getSchema,
};
