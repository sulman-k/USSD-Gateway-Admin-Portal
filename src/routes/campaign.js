const { upload } = require(`${__utils}/file-uploader`);

module.exports = (router, controller) => {
  //Packages Api's
  router.get("/getPackages", controller.getPackages);
  router.post("/addPackage", controller.addPackage);
  router.delete("/deletePackage/:id", controller.deletePackage);
  router.put("/updatePackage/:id", controller.updatePackage);
  router.get(
    "/getMsisdnCampaignHistory/:id/:db",
    controller.getMsisdnCampaignHistory
  );
  //camp units
  router.put("/updateCampaignUnits", controller.updateCampaignUnits);
  router.get("/getCampaignUnits", controller.getCampaignUnits);

  //close connection
  router.get("/closeESMEConnection/:esme_id", controller.closeESMEConnection);

  //Qouta Api's
  router.get("/getQuotaHistory", controller.getQuotaHistory);
  router.put("/updateQuota/:id", controller.updateQuota);
  router.get("/getUserQuota", controller.getUserQuota);

  //Subscribers Blacklist, Whitelist, Ported API's
  router.get("/getSubscribers", controller.getSubscribers);
  router.get("/getSubscribersGroups", controller.getSubscribersGroups);
  // router.get("/getWhiteListGroups", controller.getWhiteListGroups);
  router.post(
    "/addSubscribersList",
    upload.single("users_list"),
    controller.addSubscribersList
  );
  router.delete("/deleteSubscribersList", controller.deleteSubscribersList);
  router.delete("/deleteSubscribersGroup", controller.deleteSubscribersGroup);
  router.get("/getActivityLogs", controller.getActivityLogs);

  router.post("/addGroupDescription", controller.addGroupDescription);
  router.post("/downlaodMsisdnGroup", controller.downlaodMsisdnGroup);
};
