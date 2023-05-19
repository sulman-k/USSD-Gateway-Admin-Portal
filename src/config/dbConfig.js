const mariadb = require("mariadb");

exports.adminPool = mariadb.createPool({
  host: process.env.ADMIN_DB_HOST,
  user: process.env.ADMIN_DB_USER,
  password: process.env.ADMIN_DB_PASSWORD,
  database: process.env.ADMIN_DB_NAME,
  port: process.env.ADMIN_PORT,
  permitLocalInfile: true,

  connectionLimit: 100,
});

exports.campaignPool = mariadb.createPool({
  host: process.env.CAMPAIGN_DB_HOST,
  user: process.env.CAMPAIGN_DB_USER,
  password: process.env.CAMPAIGN_DB_PASSWORD,
  database: process.env.CAMPAIGN_DB_NAME,
  port: process.env.CAMPAIGN_PORT,
  permitLocalInfile: true,

  connectionLimit: 100,
});

exports.servicePool = mariadb.createPool({
  host: process.env.SERVICE_DB_HOST,
  user: process.env.SERVICE_DB_USER,
  password: process.env.SERVICE_DB_PASSWORD,
  database: process.env.SERVICE_DB_NAME,
  port: process.env.SERVICE_PORT,
  permitLocalInfile: true,

  connectionLimit: 100,
});

exports.reportingPool = mariadb.createPool({
  host: process.env.REPORTING_DB_HOST,
  user: process.env.REPORTING_DB_USER,
  password: process.env.REPORTING_DB_PASSWORD,
  database: process.env.REPORTING_DB_NAME,
  port: process.env.REPORTING_PORT,
  permitLocalInfile: true,

  connectionLimit: 100,
});

exports.smppPool = mariadb.createPool({
  host: process.env.SMPP_DB_HOST,
  user: process.env.SMPP_DB_USER,
  password: process.env.SMPP_DB_PASSWORD,
  database: process.env.SMPP_DB_NAME,
  port: process.env.SMPP_DB_PORT,
  permitLocalInfile: true,

  connectionLimit: 100,
});

exports.chargingPool = mariadb.createPool({
  host: process.env.CHARGING_DB_HOST,
  user: process.env.CHARGING_DB_USER,
  password: process.env.CHARGING_DB_PASSWORD,
  database: process.env.CHARGING_DB_NAME,
  port: process.env.CHARGING_DB_PORT,
  permitLocalInfile: true,

  connectionLimit: 100,
});
