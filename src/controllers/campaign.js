const { query } = require("../config/sqlDatabase");
const {
  smppPool,
  campaignPool,
  reportingPool,
  servicePool,
  adminPool,
  WSO2Pool,
  chargingPool,
} = require("../config/dbConfig");
const paginate = require("jw-paginate");
const moduleName = "[campaign]",
  logger = require(`${__utils}/logger/logger`)(moduleName);
//const { getUsers, diameterCharging, addQuota } = require("../utils/helpers");
const { getUsers, diameterCharging, addQuota,closeConnection } = require("../utils/helpers");
let request = require("request");
const regex = new RegExp(/^[0-9]{6,14}$/);
const csv = require("csvtojson");
const fs = require("fs");
const parseString = require("xml2js").parseString;
const { USER_ROLES } = require("../config/env/core");
const axios = require("axios");
const https = require("https");
const { result } = require("underscore");
const path = require("path");
const { ResultWithContext } = require("express-validator/src/chain");
const converter = require('json-2-csv');
const directoryPath = path.join(__root, "/public/groupMsisdn");

exports.getPackages = async (req, res, next) => {
  try {
    logger.info("[getPackages][controller]");

    let result = await query(
      `SELECT * FROM packages Where status = 100;`,
      campaignPool
    );
    if (result.code) {
      logger.error("[getPackages][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getPackages][response]", { success: true, data: result });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getPackages][error]", error);

    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addPackage = async (req, res, next) => {
  try {
    logger.info("[addPackage][body]", req.body);

    const {
      package_title,
      price_per_unit,
      total_units,
      package_price,
      created_by,
    } = req.body;
    if (
      (!package_title && !price_per_unit,
        total_units && !package_price && !created_by)
    ) {
      logger.error("[addPackage][error]", {
        success: false,
        message: "Invalid Data",
      });

      res.status(422).json({ success: false, message: "Invalid Data" });
    }
    let result = await query(
      `INSERT INTO packages (package_title, price_per_unit,total_units,package_price, created_by) VALUES ('${package_title}', '${price_per_unit}','${total_units}','${package_price}', '${req.headers.enduser}');`,
      campaignPool
    );

    if (result.code) {
      logger.error("[addPackage][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[addPackage][response]", {
      success: true,
      message: "Package added successfully",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "Package added successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[addPackage][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.deletePackage = async (req, res, next) => {
  try {
    logger.info("[deletePackage][params]", req.params);

    const { id } = req.params;

    let result = await query(
      `UPDATE packages set status = -100  WHERE id = ${id}`,
      campaignPool
    );

    if (result.code) {
      logger.error("[deletePackage][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[deletePackage][response]", {
      success: true,
      message: "Successfully delete the Package",
    });
    res.json({
      success: true,
      message: "Successfully delete the Package",
    });
  } catch (error) {
    logger.error("[deletePackage][error]", error);

    res.status(500).json({ success: false, error: error });
  }
};

exports.getMsisdnCampaignHistorybkp = async (req, res, next) => {
  try {
    logger.info("[getMsisdnCampaignHistory][params]", req.params);

    const { id, db } = req.params;
    let result;
    let result1;
    let result2;
    if (db == "service") {
      result = await query(
        `select hist.cell_no,hist.response ,hist.ussd_string , ifnull(sp.esme_name,esp.esme_name) as esme_name,
        hist.is_charged, charg_hist.requested_units,
        convert(Date_Format(hist.delivery_time,'%Y-%m-%d %H:%m:%s'),CHAR) as delivery_time,hist.status, 
        hist.session_id 
        from service_history hist
        left join esme_detail sp on action_id = sp.esme_id and esme_protocol = 1
        left join esme_soap_details esp on action_id = esp.id and esme_protocol = 2
        left join charging_history charg_hist on hist.session_id = charg_hist.gw_session_id
        where cell_no=${id}`,
        reportingPool
      );

      if (result.code) {
        logger.error("[getMsisdnCampaignHistory][error]", result1);

        return res.status(400).json({
          success: false,
          message: "Invalid Query/Data! for service db",
        });
      }
    }
    if (db == "campaign") {
      result = await query(
        `select msisdn,campaign_text,user_response,
        convert(Date_Format(request_date,'%Y-%m-%d %H:%m:%s'),CHAR) as request_date,remarks,success 
        from campaign_history WHERE msisdn = ${id}`,
        reportingPool
      );

      if (result.code) {
        logger.error("[getMsisdnCampaignHistory][error]", result);

        return res
          .status(400)
          .json({ success: false, message: "Invalid Query/Data!" });
      }
    }

    logger.info("[getMsisdnCampaignHistory][response]", {
      success: true,
      message: "Successfully retrieved the history",
      data: result,
    });
    res.json({
      success: true,
      message: "Successfully retrieved the history",
      data: result,
    });
  } catch (error) {
    logger.error("[getMsisdnCampaignHistory][error]", error);

    res.status(500).json({ success: false, error: error });
  }
};

exports.updatePackage = async (req, res) => {
  try {
    logger.info("[updatePackage][body]", req.body);

    const { id } = req.params;

    const { package_title, price_per_unit, total_units, package_price } =
      req.body;
    let result = await query(
      `UPDATE packages SET package_title='${package_title}',price_per_unit='${price_per_unit}',total_units='${total_units}',package_price='${package_price}' WHERE id = ${id}`,
      campaignPool
    );
    if (result.code) {
      logger.error("[updatePackage][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[updatePackage][response]", {
      success: true,
      message: "Successfully update the Package details ",
    });

    res.json({
      success: true,
      message: "Successfully update the Package details ",
    });
  } catch (error) {
    logger.error("[updatePackage][error]", error);

    res.status(500).json({ success: false, error: error });
  }
};
exports.getQuotaHistory = async (req, res, next) => {
  try {
    logger.info("[getQuotaHistory][controller]");
    const result = await query(`SELECT * FROM quota_history`, campaignPool);
    if (result.code) {
      logger.error("[getQuotaHistory][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }
    logger.info("[getQuotaHistory][response]", { success: true, data: result });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getQuotaHistory][error]", error);

    res.status(500).json({ success: false, error: error.message });
  }
};
exports.getUserQuota = async (req, res, next) => {
  try {
    logger.info("[getUserQuota][controller]");
    const result = await query(`SELECT * FROM user_quota`, campaignPool);
    if (result.code) {
      logger.error("[getUserQuota][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getUserQuota][response]", { success: true, data: result });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getUserQuota][error]", error);

    res.status(500).json({ success: false, error: error.message });
  }
};
exports.updateQuota = async (req, res, next) => {
  try {
    logger.info("[updateQuota][body]", req.body);

    const { balance } = req.body;
    const { id } = req.params;

    var result = await query(
      `SELECT * FROM quota_history WHERE id=${id}`,
      campaignPool
    );

    if (!balance || result.length == 0) {
      logger.error("[updateQuota][error]", {
        success: false,
        message: "Invalid data.",
      });
      return res.status(422).json({ success: false, message: "Invalid data." });
    }

    let updatedBalance = result[0].balance + balance;

    var result2 = await query(
      `UPDATE quota_history SET balance='${updatedBalance}' WHERE id=${id}`,
      campaignPool
    );
    if (result2.code) {
      logger.error("[updateQuota][error]", result2);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[updateQuota][response]", {
      success: true,
      message: "quota updated successfully",
      data: result2,
    });

    res.status(200).json({
      success: true,
      message: "quota updated successfully",
      data: result2,
    });
  } catch (error) {
    logger.error("[updateQuota][error]", error);

    res.status(500).json({ success: false, error: error });
  }
};
exports.getSubscribersGroups = async (req, res, next) => {
  try {
    logger.info("[getSubscribersGroups][query]", req.query);

    const { table_name, pageSize, currentPage } = req.query;
    let offset = (currentPage - 1) * pageSize;

    let pool = campaignPool;
    if (
      table_name == "recycle_listed_msisdn_group" ||
      table_name == "white_listed_msisdn_group" ||
      table_name == "exclusive_listed_msisdn_group" 
    ) {
      pool = servicePool;
    }

    let totalRecords = await query(
      `Select count(*) as totalRcd from ${table_name}`,
      pool
    );

    let joinTable = table_name.replace('_group', '');
    const totalPages = Math.ceil(totalRecords[0].totalRcd / pageSize);

    let result = await query(
      `SELECT *
      FROM ${table_name}
      WHERE EXISTS
      (SELECT group_id FROM ${joinTable} WHERE group_id=${table_name}.id) limit ${offset},${pageSize}`,
      pool
    );



    if (result.code) {
      logger.error("[getSubscribersGroups][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getSubscribersGroups][response]", {
      success: true,
      data: { totalPages, result, totalRcd: totalRecords[0].totalRcd },
    });

    res.status(200).json({
      success: true,
      data: { totalPages, result, totalRcd: totalRecords[0].totalRcd },
    });
  } catch (error) {
    logger.error("[getSubscribersGroups][error]", error);

    res.status(500).json({ success: false, error: error.message });
  }
};
exports.getSubscribers = async (req, res, next) => {
  try {
    logger.info("[getSubscribers][query]", req.query);

    const { table_name, pageSize, currentPage, search } = req.query;

    let offset = (currentPage - 1) * pageSize;

    let pool = campaignPool;
    if (
      table_name == "recycle_listed_msisdn" ||
      table_name == "white_listed_msisdn" ||
      table_name == "exclusive_listed_msisdn" 
    ) {
      pool = servicePool;
    }

    let totalRecords = await query(
      `Select count(*) as totalRcd from ${table_name}`,
      pool
    );

    const totalPages = Math.ceil(totalRecords[0].totalRcd / pageSize);

    let result = await query(
      `select ${table_name}.*, ${table_name}_group.group_name  from ${table_name} join ${table_name}_group on ${table_name}.group_id = ${table_name}_group.id limit ${offset},${pageSize}`,
      pool
    );

    if (result.code) {
      logger.error("[getSubscribers][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    if (search !== "null") {
      result = await query(
        `select ${table_name}.*, ${table_name}_group.group_name  from ${table_name} join ${table_name}_group on ${table_name}.group_id = ${table_name}_group.id WHERE msisdn LIKE '%${search}%' limit ${offset},${pageSize}`,
        pool
      );

      totalRecords = await query(
        `Select count(*) as totalRcd from ${table_name} WHERE msisdn LIKE '%${search}%'`,
        pool
      );
    }

    logger.info("[getSubscribers][response]", {
      success: true,
      data: { totalPages, result, totalRcd: totalRecords[0].totalRcd },
    });

    res.status(200).json({
      success: true,
      data: { totalPages, result, totalRcd: totalRecords[0].totalRcd },
    });
  } catch (error) {
    logger.error("[getSubscribers][error]", error);

    res.status(500).json({ success: false, error: error.message });
  }
};
formatArray = (csvObj, id) => {
  let msisdnNumbers = [];
  for (let val = 0; val < csvObj.length; val++) {
    if (regex.test(csvObj[val].msisdn || csvObj[val].MSISDN)) {
      msisdnNumbers.push(`(${csvObj[val].msisdn || csvObj[val].MSISDN},${id})`);
    }
  }
  return msisdnNumbers;
};
exports.addSubscribersList = async (req, res, next) => {
  logger.info("[addSubscribersList][body]", req.body);
  const { table_name } = req.body;
  if (req.file && table_name) {
    let filePath = req.file.path;
    filePath = filePath.replace(/\\/g, "/");

    let groupId = new Date().getTime();

    let pool = campaignPool;
    if (
      table_name == "recycle_listed_msisdn" ||
      table_name == "white_listed_msisdn" ||
      table_name == "exclusive_listed_msisdn" 
    ) {
      pool = servicePool;
    }

    await query(`DROP TABLE IF EXISTS invalid_${table_name}`, pool);

    let result1;
    let result2;
    try {
      result2 = await query(
        `INSERT INTO ${table_name}_group (id, group_name)
          SELECT * FROM (SELECT ${groupId},'${req.body.group_name}') AS tmp
          WHERE NOT EXISTS (
              SELECT group_name FROM ${table_name}_group WHERE group_name = '${req.body.group_name}');`,
        pool
      );
    } catch (error) {
      logger.error("[addSubscribersList][error]", error);
      res.status(500).json({ success: false, error: error });
    }

    try {
      if (result2.affectedRows == 0) {
        result1 = await query(
          `
            SELECT id FROM ${table_name}_group WHERE group_name = '${req.body.group_name}';`,
          pool
        );
      }
    } catch (error) {
      logger.error("[addSubscribersList][error]", error);
      res.status(500).json({ success: false, error: error });
    }

    try {
      await query(
        `create table temp_${table_name}
      (
          id         int auto_increment
              primary key,
          msisdn     varchar(13)                         null,
          created_by varchar(50)                         null,
          created_at timestamp default CURRENT_TIMESTAMP not null,
          status     int       default 0                 null,
          group_id   double    default 0                 null,
          file_name  varchar(255)                        null,
          redis_flag int                                 null,
          updated_at varchar(255)                        null,
          constraint ${table_name}_msisdn_uindex
              unique (msisdn)
      );

      `,
        pool
      );

      await query(
        `LOAD DATA LOCAL INFILE '${filePath}' REPLACE INTO TABLE temp_${table_name} FIELDS TERMINATED BY ','
          (msisdn)
          SET group_id=${result2.affectedRows != 0 ? groupId : result1[0].id};`,
        pool
      );

      //let getData = await query(`SELECT * from ${table_name};`, pool);

      let updateFormat = await query(
        `update temp_${table_name} set msisdn=REGEXP_SUBSTR(msisdn,"[0-9]+");`,
        pool
      );
      if (updateFormat.code) {
        logger.error("[addSubscribersList][error]", updateFormat);
        return res
          .status(400)
          .json({ success: false, message: "Invalid Query/Data!" });
      }

      await query(
        `create table invalid_${table_name}
        (
          msisdn     varchar(50)                         null
      );

      `,
        pool
      );

      await query(
        `INSERT INTO invalid_${table_name} (msisdn) SELECT msisdn FROM temp_${table_name} WHERE isnull(msisdn)=1 OR msisdn NOT REGEXP '^[0-9]{11,13}+$';`,
        pool
      );

      await query(
        `DELETE FROM temp_${table_name} WHERE isnull(msisdn)=1 OR msisdn NOT REGEXP '^[0-9]{11,13}+$';`,
        pool
      );
      // let insertTable1;
      // if (getData.length > 0) {
      //   insertTable1 = await query(
      //     `INSERT INTO ${table_name} (msisdn,group_id) SELECT msisdn,group_id from temp_${table_name} WHERE temp_${table_name}.msisdn NOT IN (SELECT ${table_name}.msisdn FROM ${table_name})`,
      //     pool
      //   );
      // } else {
        let insertTable1 =  await query(
          `INSERT INTO ${table_name} (msisdn,group_id)
          SELECT msisdn,group_id
          FROM temp_${table_name}`,
          pool
        );
     // }

      if (
        table_name == "recycle_listed_msisdn"
      ) {
        await query(
          `insert into bank_consent_details_archive select * from bank_consent_details where msisdn in (select msisdn from recycle_listed_msisdn)`,
          pool
        );
        await query(
          `delete from bank_consent_details where msisdn in (select msisdn from recycle_listed_msisdn)`,
          pool
        );
      }

      if (result.code) {
        logger.error("[addSubscribersList][error]", result);
        return res
          .status(400)
          .json({ success: false, message: "Invalid Query/Data!" });
      }

      await query(`DROP TABLE IF EXISTS temp_${table_name}`, pool);
      fs.unlinkSync(req.file.path);
      logger.info("[addSubscribersList][response]", {
        success: true,
        message:
          insertTable1.affectedRows == 0
            ? (message = "Invalid msisdn or it already exists.")
            : "MSISDNS Added successfully",
      });

      let invalidData = await query(
        `SELECT * FROM invalid_${table_name}`,
        pool
      );

      res.status(200).json({
        success: true,
        invalidData: invalidData,
        message:
          insertTable1.affectedRows == 0
            ? (message = "Invalid msisdn or it already exists.")
            : "MSISDNS Added successfully",
      });
    } catch (error) {
      fs.unlinkSync(req.file.path);
      await query(`DROP TABLE IF EXISTS temp_${table_name}`, pool);
      await query(`DROP TABLE IF EXISTS invalid_${table_name}`, pool);

      logger.error("[addSubscribersList][error]", error);

      res.status(500).json({ success: false, error: error });
    }
    // });
  } else {
    logger.error("[addSubscribersList][error]", {
      success: false,
      message: "Invalid data.",
    });
    res.status(422).json({ success: false, message: "Invalid data." });
  }
};

exports.deleteSubscribersList = async (req, res, next) => {
  try {
    logger.info("[deleteSubscribersList][body]", req.body);

    let { ids, table_name } = req.body;

    let pool = campaignPool;
    if (
      table_name == "recycle_listed_msisdn" ||
      table_name == "white_listed_msisdn" ||
      table_name == "exclusive_listed_msisdn"
    ) {
      pool = servicePool;
    }

    if (ids.length !== 0) {
      let result = await query(
        `DELETE FROM ${table_name} WHERE id IN  (${ids})`,
        pool
      );

      if (result.code) {
        logger.error("[deleteSubscribersList][error]", result);

        return res
          .status(400)
          .json({ success: false, message: "Invalid Query/Data!" });
      }

      logger.info("[deleteSubscribersList][response]", {
        success: true,
        message: "Successfully! delete the records",
        data: result,
      });

      res.status(200).json({
        success: true,
        message: "Successfully! delete the records",
        data: result,
      });
    } else {
      logger.error("[deleteSubscribersList][error]", {
        success: false,
        message: "Invalid data.",
      });

      res.status(422).json({ success: false, message: "Invalid data." });
    }
  } catch (error) {
    logger.error("[deleteSubscribersList][error]", error);

    res.status(500).json({ success: false, error: error });
  }
};

exports.deleteSubscribersGroup = async (req, res, next) => {
  try {
    logger.info("[deleteSubscribersGroup][body]", req.body);

    let { ids, table_name } = req.body;
    let msisdn_table_name = table_name.replace("_group", "");

    let pool = campaignPool;
    if (
      table_name == "recycle_listed_msisdn_group" ||
      table_name == "white_listed_msisdn_group" ||
      table_name == "exclusive_listed_msisdn_group"
    ) {
      pool = servicePool;
    }

    if (ids.length !== 0) {
      await query(`DELETE FROM ${table_name} WHERE id IN  (${ids})`, pool);
      await query(
        `DELETE FROM ${msisdn_table_name} WHERE group_id IN  (${ids})`,
        pool
      );
      // if (result.code) {
      //   logger.error("[deleteSubscribersGroup][error]", result);

      //   return res
      //     .status(400)
      //     .json({ success: false, message: "Invalid Query/Data!" });
      // }

      logger.info("[deleteSubscribersGroup][response]", {
        success: true,
        message: "Successfully! delete the records",
        //data: result,
      });

      res.status(200).json({
        success: true,
        message: "Successfully! delete the records",
        //data: result,
      });
    } else {
      logger.error("[deleteSubscribersGroup][error]", {
        success: false,
        message: "Invalid data.",
      });

      res.status(422).json({ success: false, message: "Invalid data." });
    }
  } catch (error) {
    logger.error("[deleteSubscribersGroup][error]", error);

    res.status(500).json({ success: false, error: error });
  }
};

exports.addGroupDescription = async (req, res) => {
  try {
    logger.info("[addGroupDescription][body]", req.body);

    const { id, table_name, description } = req.body;

    if (!id && !table_name && !description) {
      logger.error("[addQuota][error]", {
        success: false,
        message: "Incomplete data for insertion",
      });

      return res
        .status(422)
        .json({ success: false, message: "Incomplete data for insertion" });
    }
    let pool = campaignPool;
    if (
      table_name == "recycle_listed_msisdn_group" ||
      table_name == "white_listed_msisdn_group" ||
      table_name == "exclusive_listed_msisdn_group"
    ) {
      pool = servicePool;
    }
    let result = await query(
      `UPDATE ${table_name} SET description='${description}' WHERE id = ${id}`,
      pool
    );

    if (result.code) {
      logger.error("[addGroupDescription][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[addGroupDescription][response]", {
      success: true,
      message: "Successfully updated group description",
    });

    res.json({
      success: true,
      message: "Successfully updated group description",
    });
  } catch (error) {
    logger.error("[addGroupDescription][error]", error);

    res.status(500).json({ success: false, error: error });
  }
};


exports.downlaodMsisdnGroup = async (req, res) => {
  try {
    logger.info("[downlaodMsisdnGroup][body]", req.body);

    const { id, group_name, table_name } = req.body;

    if (!id && !group_name && !table_name) {
      logger.error("[downlaodMsisdnGroup][error]", {
        success: false,
        message: "Incomplete data for insertion",
      });

      return res
        .status(422)
        .json({ success: false, message: "Incomplete data for insertion" });
    }

    let pool = campaignPool;
    let queryStr ="";
    let table_name_updated = table_name.replace("_group", "");
    if (
      table_name == "recycle_listed_msisdn_group" ||
      table_name == "white_listed_msisdn_group" || 
      table_name == "exclusive_listed_msisdn_group"
    ) {
      pool = servicePool;
    }
    if(table_name == "recycle_listed_msisdn_group" || table_name == "port_listed_msisdn_group" ||  table_name == "exclusive_listed_msisdn_group")
    {
      queryStr = `select msisdn from ${table_name_updated} WHERE group_id = ${id}`;
    }
    if(table_name == "black_listed_msisdn_group")
    {
      queryStr = `select msisdn,status from ${table_name_updated} WHERE group_id = ${id}`;
    }
    if(table_name == "white_listed_msisdn_group")
    {
      queryStr = `select msis.msisdn,grp.group_name from ${table_name_updated} msis join ${table_name} grp on msis.group_id=grp.id WHERE group_id = ${id}`;
    }

    let retrievedData = await query(
      queryStr,
      pool
    );


    // convert JSON array to CSV string
    converter.json2csv(retrievedData, (err, csv) => {
      if (err) {
        throw err;
      }

      const file = `${__dirname}/public/MSISDN_List.csv`;
      console.log("file: ", file);
      // write CSV to a file
      fs.writeFileSync(file, csv);

      res.download(file); 

    });
  } catch (error) {
    logger.error("[downlaodMsisdnGroup][error]", error);

    res.status(500).json({ success: false, error: error });
  }
};

exports.getActivityLogs = async (req, res, next) => {
  try {
    logger.info("[getActivityLogs][query]", req.query);

    let { portal, pageSize, currentPage, search } = req.query;

    let pool;

    pageSize = parseInt(pageSize);
    currentPage = parseInt(currentPage);

    if (portal == "campaign" || portal == "Campaign") pool = campaignPool;
    if (portal == "service" || portal == "Service") pool = servicePool;
    if (portal == "reporting" || portal == "Reporting") pool = reportingPool;
    if (portal == "admin" || portal == "Admin") pool = adminPool;

    let offset = (currentPage - 1) * pageSize;

    let totalRecords = await query(
      `Select count(*) as totalRcd from activity_logs `,
      pool
    );

    const totalPages = Math.ceil(totalRecords[0].totalRcd / pageSize);

    let logsQuery = await query(
      `SELECT * FROM activity_logs ORDER BY timestamp DESC limit ${offset},${pageSize};`,
      pool
    );

    if (search !== "null") {
      logsQuery = await query(
        `select * from activity_logs WHERE message LIKE '%${search}%' or timestamp LIKE '%${search}%' limit ${offset},${pageSize}`,
        pool
      );

      totalRecords = await query(
        `Select count(*) as totalRcd from activity_logs WHERE message LIKE '%${search}%' or timestamp LIKE '%${search}%'`,
        pool
      );
    }

    if (logsQuery.code) {
      logger.error("[getActivityLogs][error]", logsQuery);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getActivityLogs][response]", {
      success: true,
      message: "Logs Fetched Successfuly",
      data: {},
    });

    res.status(200).json({
      success: true,
      message: "Logs Fetched Successfuly",
      data: { totalPages, logsQuery, totalRcd: totalRecords[0].totalRcd },
    });
  } catch (error) {
    logger.error("[getActivityLogs][error]", error);

    res.json({ success: false, error: error });
  }
};

exports.updateCampaignUnits = async (req, res, next) => {
  try {
    logger.info("[updateCampaignUnits][body]", req.body);

    let { campType, units } = req.body;
    const result = await query(
      `UPDATE transaction_units SET units_per_transaction=${units} WHERE camp_type=${campType}`,
      campaignPool
    );
    if (result.code) {
      logger.error("[updateCampaignUnits][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[updateCampaignUnits][response]", {
      success: true,
      data: result,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[updateCampaignUnits][error]", error);

    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getCampaignUnits = async (req, res, next) => {
  try {
    logger.info("[getCampaignUnits][controller]");

    const result = await query(`SELECT * FROM transaction_units`, campaignPool);
    if (result.code) {
      logger.error("[getCampaignUnits][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getCampaignUnits][response]", {
      success: true,
      data: result,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getCampaignUnits][error]", error);

    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMsisdnCampaignHistory = async (req, res, next) => {
  try {
    logger.info("[getMsisdnCampaignHistory][params]", req.params);
    logger.info("[getMsisdnCampaignHistory][queryparams]", req.query);

    const { id,db } = req.params;
    const {dt_from,dt_to}=req.query;
    let result;
    
    if (db == "service") {
      result = await query(
        `select hist.cell_no,hist.response ,hist.ussd_string , ifnull(sp.esme_name,esp.esme_name) as esme_name,
        hist.is_charged, charg_hist.requested_units,convert(Date_Format(hist.delivery_time,'%Y-%m-%d %H:%m:%s'),CHAR) as delivery_time,hist.status, hist.session_id from service_history hist
        left join esme_detail sp on action_id = sp.esme_id and esme_protocol = 1
        left join esme_soap_details esp on action_id = esp.id and esme_protocol = 2
        left join charging_history charg_hist on hist.session_id = charg_hist.gw_session_id
        where cell_no=${id} and Date(hist.delivery_time) between '${dt_from}' and '${dt_to}';`,
        reportingPool
      );

      if (result.code) {
        logger.error("[getMsisdnCampaignHistory][error]", result);

        return res.status(400).json({
          success: false,
          message: "Invalid Query/Data! for service db",
        });
      }
    }
    if (db == "campaign") {
      result = await query(
        `select msisdn,campaign_text,user_response,convert(Date_Format(request_date,'%Y-%m-%d %H:%m:%s'),CHAR) as request_date,remarks,success 
        from campaign_history WHERE msisdn = ${id}  and Date(request_date) between  '${dt_from}' and '${dt_to}';`,
        reportingPool
      );

      if (result.code) {
        logger.error("[getMsisdnCampaignHistory][error]", result);

        return res
          .status(400)
          .json({ success: false, message: "Invalid Query/Data!" });
      }
    }

    logger.info("[getMsisdnCampaignHistory][response]", {
      success: true,
      message: "Successfully retrieved the history",
      data: result,
    });
    res.json({
      success: true,
      message: "Successfully retrieved the history",
      data: result,
    });
  } catch (error) {
    logger.error("[getMsisdnCampaignHistory][error]", error);

    res.status(500).json({ success: false, error: error });
  }
};

exports.closeESMEConnection = async (req, res, next) => {
  try {
    const { esme_id } = req.params;
    let result;
    logger.info("[closeESMEConn][params]", req.params);

    let result2 = await query(
      `SELECT distinct smpp_gw_url FROM esme_binding_detail WHERE esme_id=${esme_id}`,
      smppPool
    );

    console.log("length here is this", result2);

    result2.forEach(async element => {
      console.log('Elements in the Result 2::: ' , element);
      console.log('Esme ID' , esme_id);
      let closeConnURL=element.smpp_gw_url.replace('sendSmppGWRequest','sendSmppSessionDestoryRequest');
       result =  await closeConnection(closeConnURL,esme_id);
       console.log("Close Connection Result :::::::::: ", result)
    });

    res.status(200).json({
      success: true,      
      message: "sendSmppSessionDestoryRequest called successfully",
      data:result
    });

  } 
  catch (error) {
    logger.error("[closeESMEConn][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

