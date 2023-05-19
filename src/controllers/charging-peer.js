const { query } = require("../config/sqlDatabase");
const { chargingPool } = require("../config/dbConfig");
const moduleName = "[charging-peers]",
  logger = require(`${__utils}/logger/logger`)(moduleName);

exports.getChargingPeers = async (req, res, next) => {
  try {
    logger.info("[getChargingPeers][controller]");

    let result = await query(
      `SELECT * FROM charging_peers WHERE record_status=100`,
      chargingPool
    );
    if (result.code) {
      logger.error("[getChargingPeers][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getChargingPeers][response]", {
      success: true,
      data: result,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getChargingPeers][error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addChargingPeer = async (req, res, next) => {
  try {
    logger.info("[addChargingPeer][body]", req.body);

    const {
      peerType,
      peerGroup,
      destPort,
      destHost,
      peerName,
      contimeout,
      dest_realm,
    } = req.body;

    if (
      !peerType &&
      !peerGroup &&
      !destPort &&
      !destHost &&
      !peerName &&
      !contimeout &&
      !dest_realm
    ) {
      logger.error("[addChargingPeer][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    let result = await query(
      `INSERT INTO charging_peers (peer_type, peer_group, dest_port, dest_host, peer_name, conn_time_out, dest_realm) VALUES 
        ('${peerType}', '${peerGroup}', '${destPort}', '${destHost}', '${peerName}', ${contimeout}, '${dest_realm}');`,
      chargingPool
    );

    if (result.code) {
      logger.error("[addChargingPeer][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[addChargingPeer][response]", {
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
    logger.error("[addChargingPeer][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.updateChargingPeer = async (req, res, next) => {
  try {
    logger.info("[updateChargingPeer][body]", req.body);

    const {
      peerId,
      peerType,
      peerGroup,
      destPort,
      destHost,
      peerName,
      contimeout,
      dest_realm,
    } = req.body;

    if (
      !peerId &&
      !peerType &&
      !peerGroup &&
      !destPort &&
      !destHost &&
      !peerName
    ) {
      logger.error("[updateChargingPeer][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    let result = await query(
      `UPDATE charging_peers SET peer_type=${peerType}, peer_group='${peerGroup}', dest_port='${destPort}',
      dest_host='${destHost}', peer_name='${peerName}', conn_time_out=${contimeout}, dest_realm='${dest_realm}' WHERE id=${peerId};`,
      chargingPool
    );

    if (result.code) {
      logger.error("[updateChargingPeer][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[updateChargingPeer][response]", {
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
    logger.error("[updateChargingPeer][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.deleteChargingPeer = async (req, res, next) => {
  try {
    logger.info("[deleteChargingPeer][body]", req.body);

    let result = await query(
      `UPDATE charging_peers SET record_status=-100 WHERE id=${req.params.id}`,
      chargingPool
    );

    if (result.code) {
      logger.error("[deleteChargingPeer][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[deleteChargingPeer][response]", {
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
    logger.error("[deleteChargingPeer][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.getPeersById = async (req, res, next) => {
  try {
    logger.info("[getPeersById][controller]");

    let result = await query(
      `SELECT * FROM charging_peers WHERE peer_type=${req.params.type}`,
      chargingPool
    );
    if (result.code) {
      logger.error("[getPeersById][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getPeersById][response]", { success: true, data: result });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getPeersById][error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
