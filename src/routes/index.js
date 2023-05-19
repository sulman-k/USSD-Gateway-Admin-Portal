const express = require("express"),
  campaign = require(`${__controllers}/campaign`),
  user = require(`${__controllers}/user`),
  node_config = require(`${__controllers}/node-configuration`),
  peer_group = require(`${__controllers}/peer-group`),
  charging_peer = require(`${__controllers}/charging-peer`),
  charging_nodes = require(`${__controllers}/charging-nodes`),
  smpp_config = require(`${__controllers}/smpp-config`),
  http_config = require(`${__controllers}/http-config`),
  router = express.Router();

require(`${__routes}/campaign`)(router, campaign);
require(`${__routes}/http-config`)(router, http_config);
require(`${__routes}/smpp-config`)(router, smpp_config);

require(`${__routes}/charging-nodes`)(router, charging_nodes);

require(`${__routes}/charging-peer`)(router, charging_peer);
require(`${__routes}/peer-group`)(router, peer_group);

require(`${__routes}/node-configuration`)(router, node_config);

require(`${__routes}/user`)(router, user);

// Default Routes, This line should be the last line of this module.
require(`${__routes}/default`)(router);

module.exports = router;
