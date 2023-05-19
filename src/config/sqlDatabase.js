const moduleName = "[sqlDatabase]",
  logger = require(`${__utils}/logger/logger`)(moduleName);

exports.query = async (query, pool) => {
  let connection;
  let promise = await new Promise(async (resolve, reject) => {
    connection = await pool.getConnection();

    try {
      logger.info("[query]", query);
      logger.info("[pool]", pool);

      const res = await connection.query(query, [1, "mariadb"]);
      // logger.info("[query][result]", res);

      connection.end();
      resolve(res);
    } catch (error) {
      logger.error("[query][error]", error);

      connection.end();

      reject(error);
    }
  });

  return promise;
};
