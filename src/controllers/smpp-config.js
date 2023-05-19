const { query } = require("../config/sqlDatabase");
const { smppPool, servicePool } = require("../config/dbConfig");
const { json } = require("body-parser");
const moduleName = "[smpp-config]",
  logger = require(`${__utils}/logger/logger`)(moduleName);

exports.getSmppIps = async (req, res, next) => {
  try {
    logger.info("[getSmppIps][controller]");

    let result = await query(
      `SELECT * FROM smpp_server_config WHERE record_status=100`,
      smppPool
    );
    if (result.code) {
      logger.error("[getSmppIps][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getSmppIps][response]", { success: true, data: result });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getSmppIps][error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateSmppIp = async (req, res, next) => {
  try {
    logger.info("[updateSmppIp][body]", req.body);

    const { host_id, server_name } = req.body;
    if (!host_id && !server_name) {
      logger.error("[updateSmppIp][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    let result = await query(
      `UPDATE smpp_server_config SET host_id='${host_id}', server_name='${server_name}' WHERE id=${req.params.id};`,
      smppPool
    );

    if (result.code) {
      logger.error("[updateSmppIp][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[updateSmppIp][response]", {
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
    logger.error("[updateSmppIp][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.addSmppIp = async (req, res, next) => {
  try {
    logger.info("[addSmppIp][body]", req.body);

    const { host_id, server_name } = req.body;

    if (!host_id && !server_name) {
      logger.error("[addSmppIp][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    let result = await query(
      `INSERT INTO smpp_server_config (host_id, server_name, created_by) VALUES 
        ('${host_id}', '${server_name}', '${req.headers.enduser}')`,
      smppPool
    );

    if (result.code) {
      logger.error("[addSmppIp][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[addSmppIp][response]", {
      success: true,
      message: "smpp server configuration added successfully",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "smpp server configuration added successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[addSmppIp][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.deleteSmppIp = async (req, res, next) => {
  try {
    logger.info("[deleteSmppIp][params]", req.params);

    let result = await query(
      `UPDATE smpp_server_config SET record_status=-100 WHERE id=${req.params.id}`,
      smppPool
    );

    if (result.code) {
      logger.error("[deleteSmppIp][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[deleteSmppIp][response]", {
      success: true,
      message: "smpp server configuration deleted",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "smpp server configuration deleted",
      data: result,
    });
  } catch (error) {
    logger.error("[deleteSmppIp][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.getSmppPorts = async (req, res, next) => {
  try {
    logger.info("[getSmppPorts][controller]");

    let result = await query(
      `SELECT server_conf_detail.*,smpp_server_config.host_id FROM server_conf_detail LEFT JOIN smpp_server_config ON server_conf_detail.smpp_id=smpp_server_config.id WHERE server_conf_detail.record_status=100;`,
      smppPool
    );
    if (result.code) {
      logger.error("[getSmppPorts][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getSmppPorts][response]", {
      success: true,
      data: result,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getSmppPorts][error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addSmppPort = async (req, res, next) => {
  try {
    logger.info("[addSmppPort][body]", req.body);

    const { smpp_id, port, host_id, server_name } = req.body;

    if (!smpp_id && !port) {
      logger.error("[addSmppPort][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    // let result1 = await query(
    //   `INSERT INTO smpp_server_config (host_id, server_name, created_by) VALUES
    //     ('${host_id}', '${server_name}', '${req.headers.enduser}')`,
    //   smppPool
    // );

    let result;
    let arr = [];
    for (let val of port) {
      arr.push(
        `(${val.port}, ${smpp_id}, '${val.esme_name}', ${val.max_conn_size}, ${val.window_size}, ${val.bind_timeout} ,${val.request_expiry_timeout}, ${val.response_timeout}, '${req.headers.enduser}')`
      );
    }

    result = await query(
      `INSERT INTO server_conf_detail (port, smpp_id, esme_name, max_conn_size, window_size, bind_timeout,request_expiry_timeout, response_timeout, created_by) VALUES ${arr}`,
      smppPool
    );

    let result2 = await query(
      `UPDATE smpp_server_config SET has_ports=1 WHERE id=${smpp_id}`,
      smppPool
    );

    if (result.code || result2.code) {
      logger.error("[addSmppPort][error]", result.code || result2.code);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[addSmppPort][response]", {
      success: true,
      message: "smpp server configuration added successfully",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "smpp server configuration added successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[addSmppPort][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.deleteSmppPort = async (req, res, next) => {
  try {
    logger.info("[deleteSmppPort][params]", req.params);

    let result = await query(
      `UPDATE server_conf_detail SET record_status=-100 WHERE id=${req.params.id}`,
      smppPool
    );

    let result2 = await query(
      `SELECT * FROM server_conf_detail WHERE smpp_id=${req.params.smpp_id} AND record_status=100`,
      smppPool
    );

    console.log("length here is this", result2);

    if (result2.length == 0) {
      await query(
        `UPDATE smpp_server_config SET has_ports=0 WHERE id=${req.params.smpp_id}`,
        smppPool
      );
    }

    if (result.code) {
      logger.error("[deleteSmppPort][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[deleteSmppPort][response]", {
      success: true,
      message: "smpp server configuration deleted",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "smpp server configuration deleted",
      data: result,
    });
  } catch (error) {
    logger.error("[deleteSmppPort][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.updateSmppPort = async (req, res, next) => {
  try {
    logger.info("[updateSmppPort][body]", req.body);

    const {
      port,
      id,
      max_conn_size,
      window_size,
      request_expiry_timeout,
      response_timeout,
      bind_timeout,
    } = req.body;

    if (
      !port &&
      !id &&
      !max_conn_size &&
      !window_size &&
      !request_expiry_timeout &&
      !response_timeout &&
      !bind_timeout
    ) {
      logger.error("[updateSmppPort][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    let result = await query(
      `UPDATE server_conf_detail SET port=${port}, max_conn_size=${max_conn_size} , window_size=${window_size}, bind_timeout=${bind_timeout},request_expiry_timeout=${request_expiry_timeout}, response_timeout=${response_timeout} WHERE id=${id};`,
      smppPool
    );

    if (result.code) {
      logger.error("[updateSmppPort][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[updateSmppPort][response]", {
      success: true,
      message: "Port Updated Successfully",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "Port Updated Successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[updateSmppPort][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.getSmppIpPorts = async (req, res, next) => {
  try {
    logger.info("[getSmppIpPorts][params]", req.params);

    let result = await query(
      `SELECT * FROM server_conf_detail WHERE smpp_id=${req.params.id}`,
      smppPool
    );
    if (result.code) {
      logger.error("[getSmppIpPorts][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getSmppIpPorts][response]", { success: true, data: result });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getSmppIpPorts][error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.esmePortIpBinding = async (req, res, next) => {
  try {
    logger.info("[esmePortIpBinding][body]", req.body);

    const { smpp_port, esme_name } = req.body;

    if (!smpp_port && !esme_name) {
      logger.error("[esmePortIpBinding][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    let result = await query(
      `UPDATE server_conf_detail SET  esme_name='${esme_name}' WHERE port=${smpp_port};`,
      smppPool
    );

    if (result.code) {
      logger.error("[esmePortIpBinding][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[esmePortIpBinding][response]", {
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
    logger.error("[updateSmppPort][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.updateEsmeConfiguration = async (req, res, next) => {
  try {
    logger.info("[updateEsmeConfiguration][body]", req.body);

    const {
      esme_name,
      esme_ip,
      esme_port,
      esme_systemid,
      esme_password,
      esme_bind_type,
      esme_system_type,
      esme_id,
      src_adr_ton,
      src_adr_npi,
      response_timeout,
      enable_dnd,
      max_conn_size,
      window_size,
      request_expiry_timeout,
      bind_timeout,
      gw_user_id,
      ussd_mode,
      update_flag,port_status,port_status_2,port_status_3,port_status_4,port_status_5,port_status_6,
      existing_esme_ip,existing_esme_port
    } = req.body;

	if (
      !esme_name &&
      !esme_ip &&
      !esme_port &&
      !esme_systemid &&
      !esme_password &&
      !esme_bind_type &&
      !esme_system_type &&
      !esme_id &&
      !src_adr_ton &&
      !src_adr_npi &&
      !response_timeout &&
      !enable_dnd &&
      !max_conn_size &&
      !window_size &&
      !request_expiry_timeout &&
      !bind_timeout &&
      !gw_user_id && 
      !ussd_mode && 
      !update_flag && !port_status && !port_status_2 && !port_status_3 && !port_status_4 && !port_status_5 && !port_status_6 &&
      !existing_esme_ip && !existing_esme_port
    ) {
      logger.error("[updateEsmeConfiguration][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    let esmePortCheckResult = await query (`select * from esme_soap_details where esme_port=${esme_port};`,servicePool)

    if (esmePortCheckResult.length > 0)
    {
      return res
      .status(400)
      .json({ success: false, message: "Port already exists in esme soap details" });
    }

    if (update_flag)
    {
      let resultInsert = await query(
        `insert into esme_detail_modify_track
    (esme_id, esme_ip, esme_name, esme_port, port_status,port_status_2,
    port_status_3,port_status_4,port_status_5,port_status_6, modified_by, modified_at)
    values
    (${esme_id},'${existing_esme_ip}','${esme_name}',${existing_esme_port},0,0,0,0,0,0,'${req.headers.enduser}',current_timestamp);`,
    smppPool)

    if (resultInsert.code) 
      {
      logger.error("[updateSmppConfig][error]", resultInsert);
      return res
      .status(400)
      .json({ success: false, message: "Invalid query syntax." });
      }
    }

    let result = await query(
      `UPDATE esme_detail SET
      esme_name='${esme_name}',
      esme_ip='${esme_ip}',
      esme_port=${esme_port},
      esme_systemid='${esme_systemid}',
      esme_password='${esme_password}',
      esme_bind_type='${esme_bind_type}',
      esme_system_type='${esme_system_type}',
      src_adr_ton=${src_adr_ton},
      src_adr_npi=${src_adr_npi}, 
      response_timeout=${response_timeout}, 
      enable_dnd=${enable_dnd},
      max_conn_size=${max_conn_size},
      window_size=${window_size},
      request_expiry_timeout=${request_expiry_timeout},
      bind_timeout=${bind_timeout},
      port_status=0,
      gw_user_id='${gw_user_id}',
      ussd_mode=${ussd_mode},
      port_status_2=${port_status_2},port_status_3=${port_status_3},port_status_4=${port_status_4},port_status_5=${port_status_5},port_status_6=${port_status_6}  

      WHERE esme_id=${esme_id}`,
      smppPool
    );

    if (result.code) {
      logger.error("[updateEsmeConfiguration][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[updateEsmeConfiguration][response]", {
      success: true,
      message: "ESME configuration updated successfully",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "ESME configuration updated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[updateEsmeConfiguration][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.addEsmeConfiguration = async (req, res, next) => {
  try {
    logger.info("[addEsmeConfiguration][body]", req.body);

    const {
      esme_name,
      esme_ip,
      esme_port,
      esme_systemid,
      esme_password,
      esme_bind_type,
      esme_system_type,
      esme_id,
      src_adr_ton,
      src_adr_npi,
      response_timeout,
      enable_dnd,
      max_conn_size,
      window_size,
      request_expiry_timeout,
      bind_timeout,
      gw_user_id,
      ussd_mode
    } = req.body;

    if (
      !esme_name &&
      !esme_ip &&
      !esme_port &&
      !esme_systemid &&
      !esme_password &&
      !esme_bind_type &&
      !esme_system_type &&
      !esme_id &&
      !src_adr_ton &&
      !src_adr_npi &&
      !response_timeout &&
      !enable_dnd &&
      !max_conn_size &&
      !window_size &&
      !request_expiry_timeout &&
      !bind_timeout &&
      !gw_user_id &&
      !ussd_mode
    ) {
      logger.error("[addEsmeConfiguration][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }
    let esmePortCheckResult = await query (`select * from esme_soap_details where esme_port=${esme_port};`,servicePool)

    if (esmePortCheckResult.length > 0)
    {
      return res
      .status(400)
      .json({ success: false, message: "Port already exists in esme soap details" });
    }

    let result = await query(
      `INSERT INTO esme_detail (
        esme_name,
        esme_ip,
        esme_port,
        esme_systemid,
        esme_password,
        esme_bind_type,
        esme_system_type,
        src_adr_ton,
      src_adr_npi,
      response_timeout, enable_dnd,
      max_conn_size ,
      window_size ,
      request_expiry_timeout ,
      bind_timeout ,
      gw_user_id,
      ussd_mode ) VALUES ('${esme_name}',
        '${esme_ip}',
        ${esme_port},
        '${esme_systemid}',
        '${esme_password}',
        '${esme_bind_type}',
        '${esme_system_type}',
        ${src_adr_ton},
      ${src_adr_npi}, 
      ${response_timeout}, 
      ${enable_dnd},
      ${max_conn_size},
      ${window_size},
      ${request_expiry_timeout},
      ${bind_timeout},
      '${gw_user_id}',
      ${ussd_mode}
      
      )`,

      smppPool
    );


    if (result.code) {
      logger.error("[addEsmeConfiguration][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[addEsmeConfiguration][response]", {
      success: true,
      message: "ESME configuration updated successfully",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "ESME configuration updated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[addEsmeConfiguration][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.getEsmeConfiguration = async (req, res, next) => {
  try {
    logger.info("[getEsmeConfiguration][controller]");

    // let result = await query(
    //   `Select ed.*,
    //   Case when (exists(select * from esme_binding_detail where esme_id=ed.esme_id)) then 1 Else 0 END AS Status
    //   from service_portal.esme_detail ed where ed.record_status=100;`,
    //   smppPool
    // );
    let result = await query(
      `Select ed.esme_id,ed.esme_name,ed.esme_ip,ed.esme_port,ed.esme_systemid,ed.esme_password,ed.esme_bind_type,ed.esme_system_type,    
      ed.esme_bind_status,ed.record_status,ed.src_adr_ton,ed.src_adr_npi,ed.response_time,ed.response_timeout,ed.enable_dnd,ed.gw_user_id,ed.ussd_mode,ed.bind_timeout,    
      ed.max_conn_size,ed.window_size,ed.request_expiry_timeout,ed.created_by,convert(Date_Format(ed.created_at,'%Y-%m-%d %H:%m:%s'),CHAR) as created_at,
      Case when (exists(select * from esme_binding_detail where esme_id=ed.esme_id)) then 1 Else 0 END AS Status,port_status,port_status_2,port_status_3,
      port_status_4,port_status_5,port_status_6 from esme_detail ed;`,
      smppPool
    );
    
    if (result.code) {
      logger.error("[getEsmeConfiguration][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getEsmeConfiguration][response]", {
      success: true,
      data: result,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getEsmeConfiguration][error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteEsmeConfigurations = async (req, res, next) => {
  try {
       logger.info("[deleteEsmeConfigurations][params]", req.params);
       const { enableFlag } = req.query;
       let result;
       //any record in esme_detail table with port_status = 0 adds it's respective rule in the IPTABLE rules
     if (enableFlag=='true')
       {
   
          result = await query(
           `Update esme_detail set record_status=100,port_status=0,port_status_2=0,port_status_3=0,port_status_4=0,
           port_status_5=0,port_status_6=0,port_status_7=0 WHERE esme_id=${req.params.id}`,
           smppPool
         );
     
         if (result.code) {
           logger.error("[deleteEsmeConfigurations][error]", result);
     
           return res
             .status(400)
             .json({ success: false, message: "Invalid Query/Data!" });
         }
       }
 
     else
       {
             //any record in track table with port_status=0 removes it's respective rule from IPTABLE rules
           let resultInsert = await query(
           `insert into esme_detail_modify_track
           (esme_id, esme_ip, esme_name, esme_port, port_status,port_status_2,
           port_status_3,port_status_4,port_status_5,port_status_6, modified_by, modified_at)
           Select ${req.params.id},esme_ip,esme_name,esme_port,0,0,0,0,0,0,'${req.headers.enduser}',current_timestamp from esme_detail WHERE esme_id=${req.params.id};`,
           smppPool)
   
           if (resultInsert.code)
              {
                   logger.error("[deleteEsmeConfigurations][error]", resultInsert);
                   return res
                   .status(400)
                   .json({ success: false, message: "Invalid query syntax." });
              }
           else
              {
                   result = await query(
                     `Update esme_detail set record_status=-100 WHERE esme_id=${req.params.id}`,
                     smppPool
                   );
                   if (result.code) {
                     logger.error("[deleteEsmeConfigurations][error]", result);
           
                     return res
                       .status(400)
                       .json({ success: false, message: "Invalid Query/Data!" });
                   }
               }
      }
 
    logger.info("[deleteEsmeConfigurations][response]", {
      success: true,
      message: "ESME configuration deleted successfully",
      data: result,
    });
 
    res.status(200).json({
      success: true,
      message: "ESME configuration deleted successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[deleteEsmeConfigurations][error]", error);
    res.status(500).json({ success: false, error: error });
  }
 };

exports.updateTlv = async (req, res, next) => {
  try {
    logger.info("[updateTlv][body]", req.body);

    const { tag_name, tag_value, esme_id, id, tlv_value } = req.body;

    if (!tag_name && !tag_value && !esme_id && !id && !tlv_value) {
      logger.error("[updateTlv][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    let result = await query(
      `UPDATE tlv_detail SET tag_name='${tag_name}', tag_value=${tag_value}, esme_id=${esme_id}, tlv_value='${tlv_value}' WHERE id=${id}`,
      smppPool
    );

    if (result.code) {
      logger.error("[updateTlv][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[updateTlv][response]", {
      success: true,
      message: "TLV updated successfully",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "TLV updated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[updateTlv][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.addTlv = async (req, res, next) => {
  try {
    logger.info("[addTlv][body]", req.body);

    const { tag_name, tag_value, esme_id, tlv_value } = req.body;

    if (!tag_name && !tag_value && !esme_id && !tlv_value) {
      logger.error("[addTlv][error]", {
        success: false,
        message: "Invalid Data",
      });
      return res.status(203).json({ success: false, message: "Invalid data" });
    }

    let result = await query(
      `INSERT INTO tlv_detail (tag_name, tag_value, esme_id, tlv_value ) VALUES ('${tag_name}', ${tag_value}, ${esme_id}, '${tlv_value}')`,
      smppPool
    );

    if (result.code) {
      logger.error("[addTlv][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[addTlv][response]", {
      success: true,
      message: "TLV updated successfully",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "TLV updated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[addTlv][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.getTlv = async (req, res, next) => {
  try {
    logger.info("[getTlv][controller]");

    let result = await query(
      `SELECT tlv_detail.*,esme_detail.esme_name FROM tlv_detail
      LEFT JOIN esme_detail ON tlv_detail.esme_id=esme_detail.esme_id WHERE tlv_detail.record_status=100;`,
      smppPool
    );
    if (result.code) {
      logger.error("[getTlv][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getTlv][response]", {
      success: true,
      data: result,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getTlv][error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteTlv = async (req, res, next) => {
  try {
    logger.info("[deleteTlv][params]", req.params);

    let result = await query(
      `UPDATE tlv_detail SET record_status=-100 WHERE id=${req.params.id}`,
      smppPool
    );

    if (result.code) {
      logger.error("[deleteTlv][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[deleteTlv][response]", {
      success: true,
      message: "TLV deleted successfully",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "TLV deleted successfully",
      data: result,
    });
  } catch (error) {
    logger.error("[deleteTlv][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};



