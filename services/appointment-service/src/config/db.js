const sql = require('mssql');
require('dotenv').config();

const sqlConfig = process.env.DB_CONNECTION_STRING;

let poolPromise = null;

if (sqlConfig) {
  poolPromise = new sql.ConnectionPool(sqlConfig)
    .connect()
    .then(pool => {
      console.log('Connected to Azure SQL Database');
      return pool;
    })
    .catch(err => {
      console.error('Database Connection Failed! Bad Config: ', err);
      process.exit(1);
    });
} else {
  console.warn('DB_CONNECTION_STRING is not set. Database connection is skipped.');
}

module.exports = {
  sql,
  poolPromise
};
