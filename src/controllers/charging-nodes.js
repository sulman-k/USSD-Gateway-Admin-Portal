const { query } = require("../config/sqlDatabase");
const { chargingPool, servicePool } = require("../config/dbConfig");
const moduleName = "[charging-nodes]",
  logger = require(`${__utils}/logger/logger`)(moduleName);

exports.getChargingNodes = async (req, res, next) => {
  try {
    logger.info("[getChargingNodes][controller]");

    let result = await query(
      `SELECT * FROM charging_nodes WHERE record_status=100`,
      chargingPool
    );
    if (result.code) {
      logger.error("[getChargingNodes][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getChargingNodes][response]", {
      success: true,
      data: result,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getChargingNodes][error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addChargingNode = async (req, res, next) => {
  try {
    logger.info("[addChargingNode][body]", req.body);

    const {
      vendorId,
      productName,
      hostRealm,
      hostPort,
      serverName,
      hostId,
      version,
    } = req.body;

    if (
      !serverName &&
      !hostId &&
      !hostPort &&
      !hostRealm &&
      !vendorId &&
      !productName &&
      !version
    ) {
      logger.error("[addChargingNode][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    let result = await query(
      `INSERT INTO charging_nodes (server_name, host_id, host_port, host_realm, vendor_id, product_name, smpp_version) VALUES 
        ('${serverName}', '${hostId}', '${hostPort}', '${hostRealm}', ${vendorId}, '${productName}', '${version}');`,
      chargingPool
    );

    if (result.code) {
      logger.error("[addChargingNode][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[addChargingNode][response]", {
      success: true,
      message: "peer group added successfully",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "peer group added successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[addChargingNode][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.updateChargingNode = async (req, res, next) => {
  try {
    logger.info("[updateChargingNode][body]", req.body);

    const {
      id,
      serverName,
      hostId,
      hostPort,
      hostRealm,
      vendorId,
      productName,
      version,
    } = req.body;

    if (!id && !serverName && !hostId && !hostPort && !hostRealm && !version) {
      logger.error("[updateChargingNode][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    let result = await query(
      `UPDATE charging_nodes SET server_name='${serverName}', host_id='${hostId}', host_port='${hostPort}',
       host_realm='${hostRealm}', vendor_id=${vendorId}, product_name='${productName}', smpp_version='${version}' WHERE id=${id};`,
      chargingPool
    );

    if (result.code) {
      logger.error("[updateChargingNode][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[updateChargingNode][response]", {
      success: true,
      message: "Peer group updated successfully",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "Peer group updated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[updateChargingNode][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.deleteChargingNode = async (req, res, next) => {
  try {
    logger.info("[deleteChargingNode][params]", req.params);

    let result = await query(
      `UPDATE charging_nodes SET record_status=-100 WHERE id=${req.params.id}`,
      chargingPool
    );

    if (result.code) {
      logger.error("[deleteChargingNode][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[deleteChargingNode][response]", {
      success: true,
      message: "Peer group updated successfully",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "Peer group updated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[deleteChargingNode][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.getDiameterStatus = async (req, res, next) => {
  try {
    logger.info("[getDiameterStatus][controller]");

    let result = await query(
      `SELECT * FROM diameter_status_codes`,
      servicePool
    );
    if (result.code) {
      logger.error("[getDiameterStatus][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getDiameterStatus][response]", {
      success: true,
      data: result,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getDiameterStatus][error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addDiameterStatus = async (req, res, next) => {
  try {
    logger.info("[addDiameterStatus][body]", req.body);

    const { status_code, message } = req.body;

    if (!status_code && !message) {
      logger.error("[addDiameterStatus][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    let result = await query(
      `INSERT INTO diameter_status_codes (status_code, message,created_by) VALUES 
        (${status_code}, '${message}','${req.headers.enduser}');`,
      servicePool
    );

    if (result.code) {
      logger.error("[addDiameterStatus][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[addDiameterStatus][response]", {
      success: true,
      message: "Diameter Status added successfully",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "Diameter Status added successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[addDiameterStatus][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.updateDiameterStatus = async (req, res, next) => {
  try {
    logger.info("[updateDiameterStatus][body]", req.body);

    const { id, status_code, message } = req.body;

    if (!id && !status_code && !message) {
      logger.error("[updateDiameterStatus][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    let result = await query(
      `UPDATE diameter_status_codes SET status_code=${status_code}, message='${message}' WHERE id=${id};`,
      servicePool
    );

    if (result.code) {
      logger.error("[updateDiameterStatus][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[updateDiameterStatus][response]", {
      success: true,
      message: "Diameter Status updated successfully",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "Diameter Status updated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[updateDiameterStatus][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.deleteDiameterStatus = async (req, res, next) => {
  try {
    logger.info("[deleteDiameterStatus][params]", req.params);

    let result = await query(
      `DELETE FROM diameter_status_codes WHERE id=${req.params.id}`,
      servicePool
    );

    if (result.code) {
      logger.error("[deleteDiameterStatus][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[deleteDiameterStatus][response]", {
      success: true,
      message: "Diameter Status updated successfully",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "Diameter Status updated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[deleteDiameterStatus][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};
