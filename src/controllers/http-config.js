const { query } = require("../config/sqlDatabase");
const { closeConnection } = require("../utils/helpers");
const moduleName = "[http-configuration]",
  logger = require(`${__utils}/logger/logger`)(moduleName);
const { servicePool, adminPool, smppPool } = require("../config/dbConfig");

exports.getHttpConfigs = async (req, res, next) => {
  try {
    logger.info("[getHttpConfigs][controller]");

    let result = await query(
      `SELECT * FROM esme_soap_details`,
      servicePool
    );

    if (result.code) {
      logger.error("[getHttpConfigs][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getHttpConfigs][response]", {
      success: true,
      data: result,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getHttpConfigs][error]", error);

    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addHttpConfig = async (req, res, next) => {
  try {
    logger.info("[addHttpConfig][body]", req.body);

      const { esme_address, esme_url, esme_name, username, password,
      gw_user_id,
      response_timeout, dialogue_auto_close,esme_port } = req.body;
    if (!esme_address && !esme_url && !esme_name && !username && 
      !password &&
      !gw_user_id &&
      !response_timeout && !dialogue_auto_close && !esme_port ) {
      logger.error("[addHttpConfig][error]", {
        success: false,
        message: "Invalid data.",
      });
      return res.status(203).json({ success: false, message: "Invalid data." });
    }

    let esmePortCheckResult = await query (`select * from esme_detail where esme_port=${esme_port};`,smppPool)

    if (esmePortCheckResult.length > 0)
    {
      return res
      .status(400)
      .json({ success: false, message: "Port already exists in esme details" });
    }

    let result = await query(
      `INSERT INTO esme_soap_details 
        (esme_name, esme_address, esme_url, username, password, created_by,
      gw_user_id,
      response_timeout,
      dialogue_auto_close,esme_port) VALUES 
        ('${esme_name}', '${esme_address}', '${esme_url}', '${username}', '${password}', '${req.headers.enduser}',
        '${gw_user_id}',
        ${response_timeout},
        ${dialogue_auto_close},${esme_port} );`,
      servicePool
    );

    if (result.code) {
      logger.error("[addHttpConfig][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[addHttpConfig][response]", {
      success: true,
      data: result,
    });
    res.status(200).json({
      success: true,
      message: "Esme Configuration added successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[addHttpConfig][error]", error);

    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateHttpConfig = async (req, res, next) => {
  try {
    logger.info("[updateHttpConfig][body]", req.body);

    let { esme_address, esme_url, esme_name, username, password,gw_user_id,
      response_timeout,dialogue_auto_close,esme_port,update_flag,port_status,port_status_2,port_status_3,port_status_4,port_status_5,port_status_6,
      existing_esme_address,existing_esme_port,existing_esme_url } = req.body;
    if (!esme_address && !esme_url && !esme_name && !username && !password && !gw_user_id
      && !response_timeout && !dialogue_auto_close && !esme_port
      && !update_flag && !port_status && !port_status_2 && !port_status_3 && !port_status_4 && !port_status_5 && !port_status_6 
      && !existing_esme_address && !existing_esme_port && !existing_esme_url) {
      return res.status(203).json({ success: false, message: "Invalid data." });
    }

    let esmePortCheckResult = await query (`select * from esme_detail where esme_port=${esme_port};`,smppPool)

    if (esmePortCheckResult.length > 0)
    {
      return res
      .status(400)
      .json({ success: false, message: "Port already exists in esme details" });
    }

    if (update_flag)
    {
      let resultInsert = await query(
        `insert into esme_soap_details_modify_track
    (esme_id, esme_address, esme_name, esme_port, esme_url, port_status,port_status_2,
    port_status_3,port_status_4,port_status_5,port_status_6, modified_by, modified_at)
    values
    (${req.params.id},'${existing_esme_address}','${esme_name}',${existing_esme_port},'${existing_esme_url}',0,0,0,0,0,0,'${req.headers.enduser}',current_timestamp);`,
    servicePool)

    if (resultInsert.code) 
      {
      logger.error("[updateHttpConfig][error]", resultInsert);
      return res
      .status(400)
      .json({ success: false, message: "Invalid query syntax." });
      }
    }

    let result = await query(
      `UPDATE esme_soap_details SET 
      esme_name='${esme_name}', esme_address='${esme_address}', esme_url='${esme_url}', username='${username}', password='${password}',gw_user_id='${gw_user_id}',
      port_status=0,response_timeout='${response_timeout}', dialogue_auto_close=${dialogue_auto_close},esme_port=${esme_port},port_status=${port_status}
      ,port_status_2=${port_status_2},port_status_3=${port_status_3},port_status_4=${port_status_4},port_status_5=${port_status_5},port_status_6=${port_status_6}
      WHERE id = ${req.params.id};`,
      servicePool
    );

    if (result.code) {
      logger.error("[updateHttpConfig][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[updateHttpConfig][response]", {
      success: true,
      data: result,
    });

    //let resultCLoseCon = await closeConnection(req.params.id);

    res.status(200).json({
      success: true,
      message: "Esme Configuration updated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[updateHttpConfig][error]", error);

    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteHttpConfig = async (req, res, next) => {
  try {
    logger.info("[deleteHttpConfig][params]", req.params);

    const { id } = req.params;
    if (!id) {
      res.status(203).json({
        success: false,
        message: "Invalid data.",
      });
    }
    let resultInsert = await query(`insert into esme_soap_details_modify_track
    (esme_id, esme_name, esme_port, port_status,port_status_2,
    port_status_3,port_status_4,port_status_5,port_status_6, modified_by, modified_at)
    select ${id}, esme_name,esme_port,0,0,0,0,0,0,'${req.headers.enduser}',current_timestamp
        from esme_soap_details where id=${id};`,
        servicePool);
    if (resultInsert.code) 
    {
      logger.error("[deleteHttpConfig][error]", resultInsert);
      return res
      .status(400)
      .json({ success: false, message: "Invalid query syntax." });
    }
    let result = await query(
      `Delete from esme_soap_details WHERE id = ${id};`,
      servicePool
    );
    if (result.code) {
      logger.error("[deleteHttpConfig][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[deleteHttpConfig][response]", {
      success: true,
      data: result,
    });
    res.status(200).json({
      success: true,
      message: "Esme Configuration deleted successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[deleteHttpConfig][error]", error);

    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateActiveStatus = async (req, res, next) => {
  try {
    logger.info("[updateActiveStatus][body]", req.body);

    const { smpp, http } = req.body;
    if (!smpp && !http) {
      res.status(203).json({
        success: false,
        message: "Invalid data.",
      });
    }
    let result;
    if (smpp > 0 && http == 0) {
      result = await query(
        `UPDATE server_conf_detail SET is_active=1 WHERE id=${smpp};`,
        smppPool
      );
    }
    if (smpp == 0 && http > 0) {
      result = await query(
        `UPDATE esme_soap_details SET is_active=1 WHERE id=${http};`,
        servicePool
      );
    }

    if (result.code) {
      logger.error("[updateActiveStatus][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[updateActiveStatus][response]", {
      success: true,
      data: result,
    });
    res.status(200).json({
      success: true,
      message: "Esme Configuration deleted successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[updateActiveStatus][error]", error);

    res.status(500).json({ success: false, message: error.message });
  }
};


