// dbManager.js
const mysql = require("mysql2/promise");
const { Pool } = require("pg");
const sql = require("mssql");
const { saveConnection } = require("./connectionManager");

const connections = {};

async function connectDB(config) {
  const { type, host, port, database, username, password, alias } = config;

  let pool;
  if (type === "mysql") {
    pool = mysql.createPool({ host, port, user: username, password, database });
  } else if (type === "postgres") {
    pool = new Pool({ host, port, user: username, password, database });
  } else if (type === "mssql") {
    pool = await sql.connect({
      user: username,
      password,
      database,
      server: host,
      port,
    });
  } else {
    throw new Error("Unsupported DB type");
  }

  connections[alias] = pool;
  saveConnection(username, pool);
  return pool;
}

function getConnection(alias) {
  return connections[alias];
}

module.exports = { connectDB, getConnection };
