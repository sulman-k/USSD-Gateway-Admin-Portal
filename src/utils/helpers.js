const moduleName = "[Helper]",
  // request = require("request"),
  logger = require(`${__utils}/logger/logger`)(moduleName),
  // parseString = require('xml2js').parseString;
  axios = require("axios");
const https = require("https");

(jwt_decode = require("jwt-decode")), (_ = require("lodash"));
exports.getSOAPKeySubstring = async (string) => {
  let str = Object.keys(string);
  for (let s of str) {
    if (s.includes(":claimUri")) {
      str = s.split(":")[0];
      break;
    }
  }
  return str;
};

// exports.Request = async (options) => {
//     return new Promise(resolve => {
//         request(options, function (error, response, body) {
//             if (error) {
//                 logger.error("[POSTRequest][Error]", error);
//                 throw new Error(error.message);
//             }
//             else if (response.statusCode === 401) {
//                 logger.error("[POSTRequest][Error]", "Unauthorized User.");
//                 throw new Error('Unauthorized User.');
//             }
//             else resolve({ response, body })
//         });
//     });
// }

// exports.parse = async (string) => {
//     return new Promise(resolve => {
//         parseString(string, { explicitArray: false }, async function (err, result) {
//             if (err) throw new Error(err)
//             else resolve(result);
//         });
//     });
// }

exports.mapCountryName = async (allVerifications, countries) => {
  try {
    for (let v of allVerifications) {
      let cObj = countries.find((c) => c.dialing_code == v.dialing_code);
      v.country_name = cObj.name;
    }
    return allVerifications;
  } catch (e) {
    logger.error("[Map Region Country Name Function][error]", e);
    return {
      success: false,
      msg: e.message,
    };
  }
};

exports.mapOperatorName = async (data, opt) => {
  try {
    for (let d of data) {
      for (let o of opt) {
        let _obj = o.code.find((c) => c.code == d.operator_code);
        if (_obj) {
          d.operator_name = o.name;
          console.log(d);
        }
      }
    }

    return data;
  } catch (e) {
    logger.error("[Map Operator Name Function][error]", e);
    return {
      success: false,
      msg: e.message,
    };
  }
};
let accessToken;

exports.getUserProfile = (req, token = {}) => {
  const CLAIM_URI = "http://wso2.org/claims";
  const user_profile = jwt_decode(token);
  // const user_profile = jwt_decode(
  //   "eyJ4NXQiOiJabVEwT1RabVpHTTJPVEk0WkRFelpEUmlNREZqTWpNeE16TXpNREE1WkRBeE1URXdNR1poWW1JMFpUY3dZV05qTVdGaE56Y3dOV1UyTW1VMVpXRmlPQSIsImtpZCI6IlptUTBPVFptWkdNMk9USTRaREV6WkRSaU1ERmpNak14TXpNek1EQTVaREF4TVRFd01HWmhZbUkwWlRjd1lXTmpNV0ZoTnpjd05XVTJNbVUxWldGaU9BX1JTMjU2IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJhZG1pbiIsImF1dCI6IkFQUExJQ0FUSU9OX1VTRVIiLCJhdWQiOiJWYlNfS3plRVRpdmpydkxrZmRtdWRHVUFiMEVhIiwibmJmIjoxNjQwNTk0MDIwLCJhenAiOiJWYlNfS3plRVRpdmpydkxrZmRtdWRHVUFiMEVhIiwic2NvcGUiOiJkZWZhdWx0IiwiaXNzIjoiaHR0cHM6XC9cL2xvY2FsaG9zdDo5NDQzXC9vYXV0aDJcL3Rva2VuIiwiZXhwIjoxNjQwNTk3NjIwLCJpYXQiOjE2NDA1OTQwMjAsImp0aSI6ImY4NDM0MzJiLWM2MGMtNDg5Zi04YmJjLThhNzIzN2M1YWIwMyJ9.Zt8WPRfKcMzjuSiGlvoHyKXYwkAWq2Ra2rNeMiCop4MwOilB9_B2cvfrVN69D53sJvuTSHSHlHkODvw0ip-M-xcnx5F_69q-HPA9M9it8tztg4ZOBKXJerg-c7ZsBbG_6lUnNSUkofDhU7OYRang4snvkG4cBWxQfCFlG6HJZdq-32nhG6Xpil-XniFhFBgTWNJNL6B_XpmKvmzD7eiPyjh8D-iZIbUMiCl_KIxIXah2E1XQSrZ4FF7kJ8jHwFt00Q7c2esJv-JdCv6uW-8_t2VDkdH_cXjxyAgisBao5unkm3UIn1nZj_GlFGyTj88nWulYiuEsKoiNIqh_7NlM_g"
  // );
  accessToken = token;

  req.headers.enduser = user_profile[CLAIM_URI + "/enduser"];
  req.headers.scope = user_profile["scope"];
  req.headers.enduser ? null : (req.headers.enduser = "admin@glo.com");

  const is_admin = req.headers.scope.includes("admin_access");
  req.headers.is_admin = is_admin;

  return;
};
exports.compareKeys = async (req_key = [], has_keys = [], res) => {
  const result = _.difference(req_key, has_keys);
  return result.length;
};

const agent = new https.Agent({
  rejectUnauthorized: false,
});

//end
exports.getUsers = async (id) => {
  let xmls = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
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

  let response = await axios({
    method: "post",
    url:
      "https://" +
      process.env.APIM_URL +
      ":9443/services/RemoteUserStoreManagerService.RemoteUserStoreManagerServiceHttpsSoap11Endpoint",
    httpsAgent: agent,
    // qs: { wsdl: "" },
    data: xmls,
    headers: {
      Authorization: "Basic " + process.env.APIM_CREDS,
    },
  });

  // console.log(response.data);
  return response;
};

exports.diameterCharging = async (msisdn, amount, user,shortCode,esmeName) => {
  //let Shortcode = "push_code";
  //let esmename = "push_esme";
  let session_id = "BUY_QUOTA";
  let response = await axios({
    method: "get",
    url: `${process.env.DIAMETER}/${msisdn}/${amount}/${shortCode}/${esmeName}/${session_id}`,
    headers: {
      Authorization: accessToken,
    },
  });

  return response;
};
exports.closeConnection = async (url,esme_id) => {
  console.log("closeConnectionCalled ::::: ", `${url}/${esme_id}`)
  let response = await axios({
    method: "get",
    url: `${url}/${esme_id}`,
    headers: {
      Authorization: accessToken,
    },
  });
  return response;
};

exports.addQuota = async (body) => {
  let response = await axios({
    method: "post",
    url: `http://${process.env.CAMPAIGN_API_HOST}:${process.env.CAMPAIGN_API_PORT}/api/v1/addQuota`,
    data: {
      msisdn: body.msisdn,
      balance: body.balance,
      package_id: body.package_id,
      price_per_unit: body.price_per_unit,
      number_of_units: body.number_of_units,
      user_id: body.user_id,
    },
    headers: {
      Authorization: accessToken,
    },
  });

  return response.data;
};
