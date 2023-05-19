const config = require("../config/config");
let xml2js = require("xml2js");
var parser = new xml2js.Parser();
const { query } = require("../config/sqlDatabase");
const {
  campaignPool,
  reportingPool,
  servicePool,
  adminPool,
  WSO2Pool,
} = require("../config/dbConfig");
const moduleName = "[user]",
  logger = require(`${__utils}/logger/logger`)(moduleName);
const {
  getUsers,
  diameterCharging,
  addQuota,
  getSOAPKeySubstring,
} = require("../utils/helpers");
let request = require("request");
const parseString = require("xml2js").parseString;
const { USER_ROLES } = require("../config/env/core");
const { result } = require("underscore");

exports.getAllUsers = async (req, res, next) => {
  logger.info("[getAllUsers][controller]");

  let getTenantBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
    xmlns:ser="http://service.ws.um.carbon.wso2.org">
    <soapenv:Header/>
    <soapenv:Body>
    <ser:listUsers>
    <!--Optional:-->
    <ser:filter></ser:filter>
    <!--Optional:-->
    <ser:maxItemLimit>100</ser:maxItemLimit>
    </ser:listUsers>
    </soapenv:Body>
    </soapenv:Envelope>`;

  const getTenantOptions = {
    // Request Options to get tenant data
    method: "POST",
    url:
      "https://" +
      process.env.APIM_URL +
      ":8997/services/RemoteUserStoreManagerService.RemoteUserStoreManagerServiceHttpsSoap11Endpoint",
    qs: { wsdl: "" },
    headers: {
      Authorization: "Basic " + process.env.APIM_CREDS, // Tenant credentials base64
    },
    body: getTenantBody,
    rejectUnauthorized: false,
  };

  request(getTenantOptions, function (error, response, getTenantBody) {
    if (error) res.send(error.message);
    else if (response.statusCode === 401) {
      logger.warn("[getAllUsers][Error]", "Unauthorized User.");
      res.status(401).send({ success: false, data: "Unauthorized User." });
    } else {
      parseString(
        getTenantBody,
        { explicitArray: false },
        async function (err, result) {
          // xml to js
          if (result["soapenv:Envelope"]["soapenv:Body"]) {
            let getTenantStr =
              result["soapenv:Envelope"]["soapenv:Body"][
                "ns:listUsersResponse"
              ]["ns:return"];

            getTenantStr = getTenantStr.filter((prop) => prop !== "superadmin");

            let stringifiedValues = JSON.stringify(getTenantStr).replace(
              /\[|\]/g,
              ""
            );

            const result2 = await query(
              `SELECT * FROM user_quota WHERE usr_name IN (${stringifiedValues});`,
              campaignPool
            );

            if (result2.code) {
              logger.error("[getAllUsers][error]", result);

              return res
                .status(400)
                .json({ success: false, message: "Invalid Query/Data!" });
            }

            for (let a of result2) {
              getTenantStr = getTenantStr.filter((prop) => prop !== a.usr_name);
              let { roles, rolesList } = await getUserRoles(a.usr_name);
              a.roles = roles;
              a.rolesList = rolesList;
            }

            if (getTenantStr.length > 0) {
              let sqlArr = [];
              for (let a of getTenantStr) {
                sqlArr.push(`('${a + "@gloworld.com"}','${a}')`);
              }

              const result3 = await query(
                `INSERT into user_quota (user_id, usr_name) VALUES ${sqlArr}`,
                campaignPool
              );

              if (result3.code) {
                logger.error("[getAllUsers][error]", result);

                return res
                  .status(400)
                  .json({ success: false, message: "Invalid Query/Data!" });
              }

              console.log("here", getTenantStr);
            }

            logger.info("[getAllUsers][Error]", {
              success: true,
              data: getTenantStr,
            });
            res.send({ success: true, data: result2 });
          } else {
            let getTenantStr =
              result["soapenv:Envelope"]["soapenv:Body"]["soapenv:Fault"]; // soap response error handling
            let data = {
              faultString: getTenantStr["faultstring"],
              details: getTenantStr.detail,
            };
            logger.error("[getAllUsersremo][Error]", data);
            res.status(500).json({ success: false, data });
          }
        }
      );
    }
  });
};

const getUserRoles = async (username) => {
  let getRolesBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.ws.um.carbon.wso2.org">
    <soapenv:Header/>
    <soapenv:Body>
       <ser:getRoleListOfUser>
          <!--Optional:-->
          <ser:userName>${username}</ser:userName>
       </ser:getRoleListOfUser>
    </soapenv:Body>
  </soapenv:Envelope>`;

  const getRolesOptions = {
    // Request Options to get tenant data
    method: "POST",
    url:
      "https://" +
      process.env.APIM_URL +
      ":8997/services/RemoteUserStoreManagerService.RemoteUserStoreManagerServiceHttpsSoap11Endpoint",
    qs: { wsdl: "" },
    headers: {
      Authorization: "Basic " + process.env.APIM_CREDS, // Tenant credentials base64
    },
    body: getRolesBody,
    rejectUnauthorized: false,
  };

  return new Promise((resolve, reject) => {
    request(getRolesOptions, function (error, response, getRoles) {
      if (error) reject({ success: false, data: error.message });
      else if (response.statusCode === 401) {
        logger.warn("[getUserRoles][Error]", "Unauthorized User.");
        reject({ success: false, data: "Unauthorized User." });
      } else {
        parseString(
          getRoles,
          { explicitArray: false },
          async function (err, result) {
            // xml to js
            if (result["soapenv:Envelope"]["soapenv:Body"]) {
              let roles =
                result["soapenv:Envelope"]["soapenv:Body"][
                  "ns:getRoleListOfUserResponse"
                ]["ns:return"];
              roles = Array.isArray(roles)
                ? roles.filter((role) => USER_ROLES.includes(role))
                : [];

              let data = updateRolesStructure(roles);

              resolve({ roles: data, rolesList: roles });
            }
          }
        );
      }
    });
  });
};

exports.updateUsers = async (req, res, next) => {
  try {
    logger.info("[updateCampaignUsers][params]", req.body);

    let { usr_tps, msisdn, usr_name, roles } = req.body;

    if (!usr_tps && !msisdn) {
      logger.error("[updateCampaignUsers][error]", {
        success: false,
        message: "Invalid Data",
      });
      res.status(422).json({ success: false, message: "Invalid Data" });
    }

    await updateUserRoles(usr_name, roles);

    const result = await query(
      `UPDATE user_quota SET usr_tps=${usr_tps}, msisdn=${msisdn} WHERE usr_name='${usr_name}'`,
      campaignPool
    );
    if (result.code) {
      logger.error("[updateCampaignUsers][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[updateCampaignUsers][response]", {
      success: true,
      data: result,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[updateCampaignUsers][error]", error);

    res.status(500).json({ success: false, error: error.message });
  }
};

const updateUserRoles = async (username, roles) => {
  let allRoles = [];
  addDefaultRoles(roles, allRoles);
  addPortalRoles(roles, allRoles); // add portal substring against each role and merge in one array

  allRoles = allRoles.filter((role) => USER_ROLES.includes(role)); // filter roles

  let { rolesList: existingRoles } = await getUserRoles(username);

  let newRoles = allRoles.filter((role) => !existingRoles.includes(role));
  let deletedRoles = existingRoles.filter((role) => !allRoles.includes(role));

  newRoles = RemoveUnwantedDefaultRoles(newRoles);
  deletedRoles = RemoveUnwantedDefaultRoles(deletedRoles);

  let newRolesStr = [],
    deletedRolesStr = [];
  newRoles.map((r) => {
    let str = `<ser:newRoles>${r}</ser:newRoles>`;
    newRolesStr.push(str);
  });
  newRolesStr = newRolesStr.join("\n");

  deletedRoles.map((r) => {
    let str = `<ser:deletedRoles>${r}</ser:deletedRoles>`;
    deletedRolesStr.push(str);
  });
  deletedRolesStr = deletedRolesStr.join("\n");

  if (newRoles.length || deletedRoles.length) {
    let updateRolesBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.ws.um.carbon.wso2.org">
      <soapenv:Header/>
      <soapenv:Body>
         <ser:updateRoleListOfUser>
            <!--Optional:-->
            <ser:userName>${username}</ser:userName>
            <!--Zero or more repetitions:-->
            ${deletedRolesStr}
            <!--Zero or more repetitions:-->
            ${newRolesStr}
         </ser:updateRoleListOfUser>
      </soapenv:Body>
    </soapenv:Envelope>`;

    const updateRolesOptions = {
      // Request Options to get tenant data
      method: "POST",
      url:
        "https://" +
        process.env.APIM_URL +
        ":8997/services/RemoteUserStoreManagerService.RemoteUserStoreManagerServiceHttpsSoap11Endpoint",
      qs: { wsdl: "" },
      headers: {
        Authorization: "Basic " + process.env.APIM_CREDS, // Tenant credentials base64
      },
      body: updateRolesBody,
      rejectUnauthorized: false,
    };

    return new Promise((resolve, reject) => {
      request(updateRolesOptions, function (error, response) {
        if (error) reject({ success: true, data: error.message });
        else if (response.statusCode === 401) {
          logger.warn("[getUserRoles][Error]", "Unauthorized User.");
          reject({ success: false, data: "Unauthorized User." });
        } else {
          resolve({ success: true });
        }
      });
    });
  }
};

const RemoveUnwantedDefaultRoles = (roles) => {
  if (!roles.find((role) => role.includes("campaign_"))) {
    roles = roles.filter((role) => role != "campaign");
  }
  if (!roles.find((role) => role.includes("admin"))) {
    // TODO: replace "admin" with "admin_" if allowing sub roles for ADMIN
    roles = roles.filter((role) => role != "admin");
  }
  if (!roles.find((role) => role.includes("service_"))) {
    roles = roles.filter((role) => role != "service");
  }
  if (!roles.find((role) => role.includes("reporting_"))) {
    roles = roles.filter((role) => role != "reporting");
  }

  return roles;
};

exports.createUser = async (req, res, next) => {
  logger.info("[createUser][controller]");

  let { username, password, roles } = req.body;

  const usernameRegex = new RegExp(
    /^[a-zA-Z0-9](_(?!(\.|_))|\.(?!(_|\.))|[a-zA-Z0-9]){2,18}[a-zA-Z0-9]$/
  );

  if (!username || !usernameRegex.test(username))
    return res
      .status(400)
      .send("Username should contain 4-16 alphanumeric characters");
  if (!password || password.length < 3)
    return res.status(400).send("Enter strong password");
  if (!roles) return res.status(400).send("User Role not defined");

  let allRoles = [];
  addDefaultRoles(roles, allRoles);
  addPortalRoles(roles, allRoles); // add portal substring against each role and merge in one array

  let roleList = [];
  allRoles.map((r) => {
    let str = `<ser:roleList>${r}</ser:roleList>`;
    roleList.push(str);
  });

  roleList = roleList.join("\n");

  let createUserBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.ws.um.carbon.wso2.org" xmlns:xsd="http://common.mgt.user.carbon.wso2.org/xsd">
    <soapenv:Header/>
    <soapenv:Body>
      <ser:addUser>
          <!--Optional:-->
          <ser:userName>${username}</ser:userName>
          <!--Optional:-->
          <ser:credential>${password}</ser:credential>
          <!--Zero or more repetitions:-->
          ${roleList}
          <!--Zero or more repetitions:-->
          <!--Optional:-->
          <ser:profileName>default</ser:profileName>
          <!--Optional:-->
          <ser:requirePasswordChange>0</ser:requirePasswordChange>
      </ser:addUser>
    </soapenv:Body>
  </soapenv:Envelope>`;

  const createUserOptions = {
    // Request Options to get tenant data
    method: "POST",
    url:
      "https://" +
      process.env.APIM_URL +
      ":8997/services/RemoteUserStoreManagerService.RemoteUserStoreManagerServiceHttpsSoap11Endpoint",
    qs: { wsdl: "" },
    headers: {
      Authorization: "Basic " + process.env.APIM_CREDS, // Tenant credentials base64
    },
    body: createUserBody,
    rejectUnauthorized: false,
  };

  request(createUserOptions, async function (error, response, getTenantBody) {
    if (error) res.send(error.message);
    else if (response.statusCode === 401) {
      logger.warn("[createUser][Error]", "Unauthorized User.");
      res.status(401).send({ success: false, data: "Unauthorized User." });
    } else if (response.statusCode === 500) {
      logger.warn("[createUser][Error]", response);
      res.status(500).send({ success: false, data: response.body });
    } else {
      if (response.statusCode === 202) {
        logger.info("[createUser][Created]", "User created");

        const insertUser = await query(
          `INSERT into user_quota (user_id, usr_name) VALUES ('${username}@gloworld.com', '${username}')`,
          campaignPool
        );

        if (insertUser.code) {
          logger.error("[getAllUsers][error]", result);

          return res
            .status(400)
            .json({ success: false, message: "Invalid Query/Data!" });
        }
        return res.send({ success: true, msg: "User created." });
      } else {
        logger.error("[createUser][Error]", response);
        return res
          .status(500)
          .send({ success: false, error: "Error occured while adding user" });
      }
    }
  });
};

const addDefaultRoles = (roles, allRoles) => {
  for (let role of roles) {
    if (role.parentRole == "campaign") {
      role.roles && role.roles.length ? allRoles.push("campaign") : null;
    }
    if (role.parentRole == "admin") {
      role.roles && role.roles.length ? allRoles.push("admin") : null;
    }
    if (role.parentRole == "service") {
      role.roles && role.roles.length ? allRoles.push("service") : null;
    }
    if (role.parentRole == "reporting") {
      role.roles && role.roles.length ? allRoles.push("reporting") : null;
    }
  }
};

const addPortalRoles = (roles, allRoles) => {
  for (let role of roles) {
    if (role.parentRole == "campaign") {
      role.roles &&
        role.roles.forEach(function (part, index, theArray) {
          allRoles.push("campaign_" + part);
        });
    }
    if (role.parentRole == "admin") {
      // role.roles && role.roles.forEach(function(part, index, theArray) {    // TODO: uncomment these lines if allowing sub roles for ADMIN
      //     allRoles.push("admin_" + part);
      // });
    }
    if (role.parentRole == "service") {
      role.roles &&
        role.roles.forEach(function (part, index, theArray) {
          allRoles.push("service_" + part);
        });
    }
    if (role.parentRole == "reporting") {
      role.roles &&
        role.roles.forEach(function (part, index, theArray) {
          allRoles.push("reporting_" + part);
        });
    }
  }
};

exports.updateCustomPackage = async (req, res, next) => {
  try {
    logger.info("[updateCustomPackage][params]", req.params);

    let result = await query(
      `UPDATE custom_package set custom_price =${req.body.custom_price}  WHERE id=1`,
      campaignPool
    );

    if (result.code) {
      logger.error("[updateCustomPackage][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[updateCustomPackage][response]", {
      success: true,
      message: "Successfully delete the Package",
    });
    res.json({
      success: true,
      message: "Successfully delete the Package",
    });
  } catch (error) {
    logger.error("[updateCustomPackage][error]", error);

    res.status(500).json({ success: false, error: error });
  }
};

exports.getCustomPackage = async (req, res, next) => {
  try {
    logger.info("[getCustomPackage][controller]");

    let result = await query(
      `SELECT * FROM custom_package WHERE id=1`,
      campaignPool
    );
    if (result.code) {
      logger.error("[getCustomPackage][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[getCustomPackage][response]", {
      success: true,
      data: result,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("[getCustomPackage][error]", error);

    res.status(500).json({ success: false, error: error.message });
  }
};
exports.deleteUser = async (req, res, next) => {
  logger.info("[deleteUser][controller]");

  console.log("here", req.body);
  let usr_name = req.body.usr_name;

  if (!usr_name) return res.status(400).send("Username cannot be empty");

  let deleteUserBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.ws.um.carbon.wso2.org">
    <soapenv:Header/>
    <soapenv:Body>
       <ser:deleteUser>
          <!--Optional:-->
          <ser:userName>${usr_name}</ser:userName>
       </ser:deleteUser>
    </soapenv:Body>
  </soapenv:Envelope>`;
  const deleteUserOptions = {
    // Request Options to get tenant data
    method: "POST",
    url:
    "https://" +
    process.env.APIM_URL +
    ":9443/services/RemoteUserStoreManagerService.RemoteUserStoreManagerServiceHttpsSoap11Endpoint",
    qs: { wsdl: "" },
    headers: {
      Authorization: "Basic " + process.env.APIM_CREDS, // Tenant credentials base64
    },
    body: deleteUserBody,
    rejectUnauthorized: false,
  };
  
  request(deleteUserOptions, async function (error, response, getTenantBody) {
    if (error) res.send(error.message);
    else if (response.statusCode === 401) {
      logger.warn("[deleteUser][Error]", "Unauthorized User.");
      res.status(401).send({ success: false, data: "Unauthorized User." });
    } else if (response.statusCode === 500) {
      logger.error("[deleteUser][Error]", response);
      res.status(500).send({ success: false, data: response.body });
    } else {
      if (response.statusCode === 202) {
        logger.info("[deleteUser][Deleted]", "User deleted.");

        const deleteUser = await query(
          `Delete from user_quota where user_id= '${usr_name}@gloworld.com'`,
          campaignPool
        );

        return res.send({ success: true, msg: "User deleted." });
      } else {
        logger.error("[deleteUser][Error]", response);
        return res
          .status(500)
          .send({ success: false, error: "Error occured while deleting user" });
      }
    }
  });
};

exports.changePassword = async (req, res) => {
  logger.info("[changePassword][params]", req.params);

  let { username, new_password } = req.body;

  let updateCredentialBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.ws.um.carbon.wso2.org">
    <soapenv:Header/>
    <soapenv:Body>
       <ser:updateCredentialByAdmin>
          <!--Optional:-->
          <ser:userName>${username}</ser:userName>
          <!--Optional:-->
          <ser:newCredential>${new_password}</ser:newCredential>
       </ser:updateCredentialByAdmin>
    </soapenv:Body>
  </soapenv:Envelope>`;

  const updateCredentialOptions = {
    // Request Options to update credential
    method: "POST",
    url:
      "https://" +
      process.env.APIM_URL +
      ":9443/services/RemoteUserStoreManagerService.RemoteUserStoreManagerServiceHttpsSoap11Endpoint",
    qs: { wsdl: "" },
    headers: {
      Authorization: "Basic " + process.env.APIM_CREDS, // Tenant credentials base64
    },
    body: updateCredentialBody,
    rejectUnauthorized: false, // remove this in production, only for testing
    // ca: [fs.readFileSync([certificate path], { encoding: 'utf-8' })]
  };

  request(updateCredentialOptions, function (error, response, body) {
    if (error) {
      return res.status(404).send(error.message);
    }
    if (response.statusCode === 401) {
      logger.warn("[changePassword][Error]", "Unauthorized User.");
      return res
        .status(401)
        .send({ success: false, data: "Unauthorized User." });
    }
    if (response.statusCode === 202) {
      return res.send({
        success: true,
        Response: "Password changed successfully",
      });
    }
    return res.status(500).send({
      success: false,
      Response: response.body,
    });
  });
};

exports.addQuota = async (req, res, next) => {
  try {
    logger.info("[addQuota][body]", req.body);

    const {
      msisdn,
      balance,
      package_id,
      price_per_unit,
      number_of_units,
      user_id,
    } = req.body;
    if (
      !msisdn &&
      !balance &&
      !price_per_unit &&
      !number_of_units &&
      !package_id &&
      !user_id
    ) {
      logger.error("[addQuota][error]", {
        success: false,
        message: "Incomplete data for insertion",
      });

      return res
        .status(422)
        .json({ success: false, message: "Incomplete data for insertion" });
    }

    let result = await addQuota(req.body);

    if (result.code) {
      logger.error("[addQuota][error]", result.code);
      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }

    logger.info("[addQuota][response]", {
      success: true,
      message: "Successfully insert the record",
      data: result,
    });

    res.status(200).json({
      success: true,
      message: "Successfully insert the record",
      data: result,
    });
  } catch (error) {
    logger.error("[addQuota][error]", error);
    res.status(500).json({ success: false, error: error });
  }
};

exports.quotaCharging = async (req, res, next) => {
  try {
    logger.info("[quotaCharging][controller]");

    let { balance, msisdn,shortCode,esmeName } = req.body;

    let result = await diameterCharging(msisdn, balance, req.headers.enduser,shortCode,esmeName);

    console.log("rrrrr", result);

    if (result.code) {
      logger.error("[quotaCharging][error]", result);

      return res
        .status(400)
        .json({ success: false, message: "Invalid Query/Data!" });
    }
    logger.info("[quotaCharging][response]", {
      success: true,
      data: result.data,
    });
    res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    logger.error("[quotaCharging][error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    logger.info("[getRoles][controller]");

    let getRolesBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.ws.um.carbon.wso2.org">
    <soapenv:Header/>
    <soapenv:Body>
       <ser:getRoleNames/>
    </soapenv:Body>
 </soapenv:Envelope>`;

    const getRolesOptions = {
      // Request Options to get tenant data
      method: "POST",
      url:
        "https://" +
        process.env.APIM_URL +
        ":9443/services/RemoteUserStoreManagerService.RemoteUserStoreManagerServiceHttpsSoap11Endpoint",
      qs: { wsdl: "" },
      headers: {
        Authorization: "Basic " + process.env.APIM_CREDS, // Tenant credentials base64
      },
      body: getRolesBody,
      rejectUnauthorized: false,
    };

    request(getRolesOptions, function (error, response, getTenantBody) {
      if (error) res.send(error.message);
      else if (response.statusCode === 401) {
        logger.warn("[getAllUsers][Error]", "Unauthorized User.");
        res.status(401).send({ success: false, data: "Unauthorized User." });
      } else {
        parseString(
          getTenantBody,
          { explicitArray: false },
          async function (err, result) {
            // xml to js
            if (result["soapenv:Envelope"]["soapenv:Body"]) {
              let roles =
                result["soapenv:Envelope"]["soapenv:Body"][
                  "ns:getRoleNamesResponse"
                ]["ns:return"];

              let data = updateRolesStructure(roles);

              logger.info("[getRoles][Error]", {
                success: true,
                data,
              });
              res.send({ success: true, data });
            } else {
              let getTenantStr =
                result["soapenv:Envelope"]["soapenv:Body"]["soapenv:Fault"]; // soap response error handling
              let data = {
                faultString: getTenantStr["faultstring"],
                details: getTenantStr.detail,
              };
              logger.error("[getRoles][Error]", data);
              res.status(500).json({ success: false, data });
            }
          }
        );
      }
    });

    // return res.json({ success: true, data: roles });
  } catch (error) {
    logger.error("[getRoles][error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateRolesStructure = (roles) => {
  const campaignRoles = [],
    adminRoles = [],
    serviceRoles = [],
    reportingRoles = [];
  for (let role of roles) {
    if (role.includes("campaign_")) {
      campaignRoles.push(role.split("campaign_")[1]);
    }
    if (role.includes("admin_") && !role.includes("Application/")) {
      adminRoles.push(role.split("admin_")[1]);
    }
    if (role.includes("service_")) {
      serviceRoles.push(role.split("service_")[1]);
    }
    if (role.includes("reporting_")) {
      reportingRoles.push(role.split("reporting_")[1]);
    }
  }

  let data = [
    {
      parentRole: "admin",
      roles: adminRoles,
    },
    {
      parentRole: "campaign",
      roles: campaignRoles,
    },
    {
      parentRole: "service",
      roles: serviceRoles,
    },
    {
      parentRole: "reporting",
      roles: reportingRoles,
    },
  ];

  return data;
};

exports.getProfile = async (req, res) => {
  // logger.info("[updateCredential][params]", req.params);
  // let token = req.headers.enduser;
  // console.log("tok", token);
  // let { email, new_password, old_password } = req.body;
  // const emailArray = email.split("@");

  let updateCredentialBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.ws.um.carbon.wso2.org">
  <soapenv:Header/>
  <soapenv:Body>
  <ser:getUserClaimValues>
  <!--Optional:-->
  <ser:userName>admin</ser:userName>
  <!--Optional:-->
  </ser:getUserClaimValues>
  </soapenv:Body>
  </soapenv:Envelope>`;

  const updateCredentialOptions = {
    // Request Options to update credential
    method: "POST",
    url: config.adminUrl,
    qs: { wsdl: "" },
    headers: {
      Authorization: config.adminCredentials,
    },
    body: updateCredentialBody,
    rejectUnauthorized: false, // remove this in production, only for testing
    // ca: [fs.readFileSync([certificate path], { encoding: 'utf-8' })]
  };
  console.log("response: ");

  request(updateCredentialOptions, function (error, response, body) {
    if (error) {
      logger.error("[getUserClaimValues][Error]", error);
      return res.status(404).send(error.message);
    }
    if (response.statusCode === 401) {
      logger.warn("[getUserClaimValues][Error]", "Unauthorized User.");
      return res
        .status(401)
        .send({ success: false, data: "Unauthorized User." });
    }
    if (response.statusCode === 500) {
      return res.status(500).send({
        success: false,
        body: response.body,
        Response: "Internal server error 500",
      });
    }
    parser.parseString(body, async function (err, result) {
      let response =
        result["soapenv:Envelope"]["soapenv:Body"][0][
          "ns:getUserClaimValuesResponse"
        ][0]["ns:return"];

      let string = "http://wso2.org/claims/";
      // console.log("response: ", response);
      // console.log("err", err);

      let dataArr = {};

      // let getTenantStr = result['soapenv:Envelope']['soapenv:Body']['ns:getTenantResponse']['ns:return'];

      let str = await getSOAeySubstring(response[0]); // get distinct key from soap response data

      for (let obj of response) {
        // console.log("here", obj[`${str}:claimUri"][0]);

        if (obj[`${str}:claimUri`][0] == `${string}givenname`) {
          // console.log("vlaue", obj[`${str}:value"][0]);
          Object.assign(dataArr, { firstname: obj[`${str}:value`][0] });
        }
        if (obj[`${str}:claimUri`][0] == `${string}lastname`) {
          // console.log("vlaue", obj[`${str}:value`][0]);
          Object.assign(dataArr, { lastname: obj[`${str}:value`][0] });
        }
        if (obj[`${str}:claimUri`][0] == `${string}username`) {
          // console.log("vlaue", obj[`${str}:value`][0]);
          Object.assign(dataArr, { username: obj[`${str}:value`][0] });
        }
      }

      Object.assign(dataArr, { email: req.headers.enduser });

      res.status(200).send({
        success: true,
        data: dataArr,
      });

      // let getTenantStr =
      //   result["soapenv:Envelope"]["soapenv:Body"]["soapenv:Fault"]; // soap response error handling
      // let data = {
      //   faultCode: getTenantStr["faultcode"],
      //   faultString: getTenantStr["faultstring"],
      //   details: getTenantStr.detail,
      // };
      // logger.error("[getTenant][Error]", err);
      // return res.status(500).json({ success: false, data });
    });
  });
};
