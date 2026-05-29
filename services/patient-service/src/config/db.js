const sql = require('mssql');
const winston = require('winston');
require('dotenv').config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

const sqlConfig = {
  // If running locally, you might pass a full connection string via DB_CONNECTION_STRING
  // In AKS, this will be mounted from KeyVault via Secrets Store CSI Driver
  connectionString: process.env.DB_CONNECTION_STRING,
  options: {
    encrypt: true, // Azure SQL requires encryption
    enableArithAbort: true,
    trustServerCertificate: false
  }
};

let poolPromise = null;

if (process.env.DB_CONNECTION_STRING) {
  poolPromise = new sql.ConnectionPool(sqlConfig)
    .connect()
    .then(pool => {
      logger.info('Connected to Azure SQL Database');
      return pool;
    })
    .catch(err => {
      logger.error('Database Connection Failed! Bad Config: ', err);
      process.exit(1);
    });
} else {
  logger.warn('DB_CONNECTION_STRING is not set. Database connection is skipped (mock mode or pending CSI injection).');
}

module.exports = {
  sql,
  poolPromise,
  logger
};
