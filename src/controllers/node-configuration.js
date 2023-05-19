const { query } = require("../config/sqlDatabase");
const { adminPool } = require("../config/dbConfig");
const moduleName = "[node-configuration]",
  logger = require(`${__utils}/logger/logger`)(moduleName);
const fs = require("fs");
const path = require("path");
const exec = require("child_process").exec;

exports.getNodeConfig = async (req, res, next) => {
  try {
    logger.info("[getNodeConfig][controller]");

    let result = await query(
      `SELECT * FROM node_configuration WHERE status=100 AND created_by='${req.headers.enduser}'`,
      adminPool
    );
    if (result.code) {
      logger.error("[getNodeConfig][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getNodeConfig][response]", { success: true, data: result });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getNodeConfig][error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getfileNamesPerNode = async (req, res, next) => {
  try {
    logger.info("[getfileNamesPerNode][controller]");

    let result = await query(
      `SELECT * FROM node_file_paths WHERE node_id=${req.params.id} AND created_by='${req.headers.enduser}'`,
      adminPool
    );
    if (result.code) {
      logger.error("[getfileNamesPerNode][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getfileNamesPerNode][response]", {
      success: true,
      data: result,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getfileNamesPerNode][error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addNodeConfig = async (req, res, next) => {
  try {
    logger.info("[addNodeConfig][body]", req.body);

    const {
      component,
      ip,
      host_name,
      node_desc,
      file_paths,

      // local_path,
    } = req.body;

    if (
      !component &&
      !ip &&
      !host_name &&
      !node_desc &&
      !file_paths

      // !local_path
    ) {
      logger.error("[addNodeConfig][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    let getNodes = await query(
      `SELECT * FROM node_configuration WHERE status=100`,
      adminPool
    );

    if (getNodes.code) {
      logger.error("[getNodeConfig][error]", getNodes);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    for (let obj of getNodes) {
      if (obj.component == component && obj.ip == ip) {
        return res.status(203).json({
          success: false,
          message: "Component name and ip already exists",
        });
      }
    }

    let result = await query(
      `INSERT INTO node_configuration (component, ip, host_name, node_desc, created_by) VALUES 
        ('${component}', '${ip}', '${host_name}', '${node_desc}', '${req.headers.enduser}');`,
      adminPool
    );

    let result2;
    let arr = [];
    for (let val of file_paths) {
      arr.push(
        `(${result.insertId}, '${val.path}', '${val.file_name}', '${req.headers.enduser}')`
      );
    }

    result2 = await query(
      `INSERT INTO node_file_paths (node_id, path, file_name, created_by) VALUES ${arr}`,
      adminPool
    );

    if (result.code || result2.code) {
      logger.error("[addNodeConfig][error]", result.code || result2.code);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    fs.mkdirSync(`./public/nodes/${component}/${ip}`, { recursive: true });

    await query(
      `UPDATE node_configuration SET local_path='${
        process.env.LOCAL_PATH + component + "/" + ip + "/"
      }' WHERE id=${result.insertId}`,
      adminPool
    );

    const child = exec("/bin/bash script.sh", (error, stdout, stderr) => {
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      if (error !== null) {
        console.log(`exec error: ${error}`);
      }
    });

    logger.info("[addNodeConfig][response]", {
      success: true,
      message: "Node added successfully",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "Node added successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[addNodeConfig][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.getNodeFiles = async (req, res) => {
  try {
    logger.info("[getNodeFiles][query]");
    let { component, ip, file_name } = req.query;

    if (!component && !ip && !file_name) {
      logger.error("[getNodeFiles][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    //path
    let nodeFile = path.join(
      __root,
      `/public/nodes/${component}/${ip}/${file_name}`
    );

    //stringify file data
    const fileContents = fs.readFileSync(nodeFile).toString();
    let fileData = JSON.stringify(fileContents);

    logger.info("[getNodeFiles][response]", {
      success: true,
      data: fileData,
    });

    res.json({
      success: true,
      data: fileData,
    });
  } catch (error) {
    logger.error("[getNodeFiles][error]", error);

    res.status(500).json({ success: false, error: error });
  }
};

exports.updateNodeConfigFile = async (req, res) => {
  try {
    logger.info("[updateNodeConfigFile][body]");
    let {
       data, ip, component, file_name, selectedFileId, restart } = req.body;

    if (!component && !ip && !file_name && !data) {
      logger.error("[updateNodeConfigFile][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    await query(
      `UPDATE node_file_paths SET is_restart=1 WHERE id=${selectedFileId};`,
      adminPool
    );

    if (restart) {
      const child = exec(
        `/bin/bash restartScript.sh ${selectedFileId}`,
        (error, stdout, stderr) => {
          console.log(`stdout: ${stdout}`);
          console.log(`stderr: ${stderr}`);
          if (error !== null) {
            console.log(`exec error: ${error}`);
          }
        }
      );

      await query(
        `UPDATE node_file_paths SET is_restart=0 WHERE id=${selectedFileId};`,
        adminPool
      );

      logger.info("[updateNodeConfigFile][response]", {
        success: true,
        message: "File restarted Successfully",
      });

      return res.json({
        success: true,
        message: "File restarted Successfully",
        restart: true,
      });
    }

    //get file path
    let filePath = path.join(__root, `/public/nodes/${component}/${ip}`);

    //create a backup file with date-time
    fs.copyFileSync(
      filePath + `/${file_name}`,
      filePath + `/${Date.now()}-${file_name}`
    );

    //rewriting original file
    fs.writeFileSync(filePath + `/${file_name}`, JSON.parse(data));

    const child = exec("/bin/bash script2.sh", (error, stdout, stderr) => {
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      if (error !== null) {
        console.log(`exec error: ${error}`);
      }
    });

    logger.info("[updateNodeConfigFile][response]", {
      success: true,
      message: "File updated successfully",
    });

    res.json({
      success: true,
      message: "File updated successfully",
      restart: false,
    });
  } catch (error) {
    logger.error("[updateNodeConfigFile][error]", error);

    res.status(500).json({ success: false, error: error });
  }
};

exports.updateNodeConfig = async (req, res, next) => {
  try {
    logger.info("[updateNodeConfig][body]", req.body);

    const { component, id, ip, host_name, node_desc, old_ip } = req.body;

    if (!component && !id && !ip && !host_name && !node_desc && !old_ip) {
      logger.error("[updateNodeConfig][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    let result = await query(
      `UPDATE node_configuration SET ip='${ip}', host_name='${host_name}', node_desc='${node_desc}'  WHERE id=${id};`,
      adminPool
    );

    if (result.code) {
      logger.error("[updateNodeConfig][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    fs.renameSync(
      `./public/nodes/${component}/${old_ip}`,
      `./public/nodes/${component}/${ip}`,
      { recursive: true }
    );

    logger.info("[updateNodeConfig][response]", {
      success: true,
      message: "Node added successfully",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "Node added successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[updateNodeConfig][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.deleteNodeConfig = async (req, res, next) => {
  try {
    logger.info("[deleteNodeConfig][controller]");

    let { id, component, ip } = req.body;

    if (!component && !id && !ip) {
      logger.error("[deleteNodeConfig][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    let result = await query(
      `UPDATE node_configuration SET status=-100 WHERE id=${id};`,
      adminPool
    );
    console.log("dsadsa", result);

    if (result.code) {
      logger.error("[deleteNodeConfig][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    fs.rmdirSync(`./public/nodes/${component}/${ip}`, { recursive: true });

    logger.info("[deleteNodeConfig][response]", {
      success: true,
      data: result,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[deleteNodeConfig][error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
