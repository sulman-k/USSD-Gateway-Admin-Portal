const { query } = require("../config/sqlDatabase");
const { chargingPool } = require("../config/dbConfig");
const moduleName = "[peer-group]",
  logger = require(`${__utils}/logger/logger`)(moduleName);

exports.getPeerGroups = async (req, res, next) => {
  try {
    logger.info("[getPeerGroups][controller]");

    let result = await query(
      `SELECT * FROM number_range WHERE record_status=100`,
      chargingPool
    );
    if (result.code) {
      logger.error("[getPeerGroups][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getPeerGroups][response]", { success: true, data: result });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getPeerGroups][error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addPeerGroup = async (req, res, next) => {
  try {
    logger.info("[addPeerGroup][body]", req.body);

    const { peerType, peerGroup, msisdnStartRange, msisdnStartEnd } = req.body;

    if (!peerType && !peerGroup && !msisdnStartRange && !msisdnStartEnd) {
      logger.error("[addPeerGroup][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    let result = await query(
      `INSERT INTO number_range (peer_type, peer_group, msisdn_start_range, msisdn_end_range) VALUES 
        ('${peerType}', '${peerGroup}', '${msisdnStartRange}', '${msisdnStartEnd}');`,
      chargingPool
    );

    if (result.code) {
      logger.error("[addPeerGroup][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[addPeerGroup][response]", {
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
    logger.error("[addPeerGroup][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.updatePeerGroup = async (req, res, next) => {
  try {
    logger.info("[updatePeerGroup][body]", req.body);

    const { rangeId, peerType, peerGroup, msisdnStartRange, msisdnStartEnd } =
      req.body;

    if (
      !rangeId &&
      !peerType &&
      !peerGroup &&
      !msisdnStartRange &&
      !msisdnStartEnd
    ) {
      logger.error("[updatePeerGroup][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    let result = await query(
      `UPDATE number_range SET peer_type=${peerType}, peer_group='${peerGroup}', msisdn_start_range='${msisdnStartRange}',
       msisdn_end_range='${msisdnStartEnd}' WHERE id=${rangeId};`,
      chargingPool
    );

    if (result.code) {
      logger.error("[updatePeerGroup][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[updatePeerGroup][response]", {
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
    logger.error("[updatePeerGroup][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.deletePeerGroup = async (req, res, next) => {
  try {
    logger.info("[deletePeerGroup][body]", req.body);

    let result = await query(
      `UPDATE number_range SET record_status=-100 WHERE id=${req.params.id}`,
      chargingPool
    );

    if (result.code) {
      logger.error("[deletePeerGroup][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[deletePeerGroup][response]", {
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
    logger.error("[deletePeerGroup][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};
