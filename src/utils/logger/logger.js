const { transports, format, createLogger, addColors } = require("winston");
const { combine, timestamp, printf, colorize, prettyPrint } = format;
const config = require("../../config/config");
const winstonMysql = require("@alex11/winston-mysql-transport");
const levels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "white",
    debug: "blue",
  },
};

const customFormat = combine(
  timestamp(
    // time format
    { format: "DD-MM-YYYY HH:mm:ss.SSS" }
  ),
  colorize({ all: true }),
  // format.align(),
  prettyPrint(),
  printf(
    (info) =>
      `${info.timestamp} ${process.pid}/ReportingAPIServer ${info.level}: ${info.message}`
  )
);
const options_default = {
  host: process.env.ADMIN_DB_HOST,
  user: process.env.ADMIN_DB_USER,
  password: process.env.ADMIN_DB_PASSWORD,
  database: process.env.ADMIN_DB_NAME,
  port: process.env.ADMIN_PORT,
  table: "activity_logs",
};
const logger = createLogger({
  levels: levels.levels,
  format: format.combine(
    format.json(),
    format.metadata({ message: "Server running" })
  ),
  transports: [new transports.Console(), new winstonMysql(options_default)],
});

addColors(levels.colors);

logger.info("[logger] config database: " + config.logger.dataBase.db);
// logger.info("[logger] config database: " + config.logger.dataBase.db);

module.exports = (moduleName) => {
  return {
    debug: function (message, data) {
        if(data)
        {
      if(JSON.stringify(data).length <=2000)
      {
        logger.debug(message + (data ? " " + JSON.stringify(data) : ""));
      }
    }
    },
    info: (message, data) => {
      message = `${moduleName}${message}`;
                if(data)
        {
      if(JSON.stringify(data).length <=2000)
      {
      logger.info(message + (data ? " " + JSON.stringify(data) : ""));
      }
          }
    },
    warn: function (message, data) {
      message = `${moduleName}    ${message}`;
                if(data)
        {
      if(JSON.stringify(data).length <=2000)
      {
      logger.warn(message + (data ? " " + JSON.stringify(data) : ""));
      }
          }
    },
    error: function (message, error) {
      console.error(error.message);
      if(error.message){
      if(error.message.length<= 2000)
      {
        logger.error(`${message}   ${error ? error.message : ""}`);
      }
     }
    },
  };
};
