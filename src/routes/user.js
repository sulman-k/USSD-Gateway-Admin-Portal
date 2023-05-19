module.exports = (router, controller) => {
  router.get("/getAllUsers", controller.getAllUsers);
  router.put("/updateCampaignUsers", controller.updateUsers); // remove after updating endpoint on frontend
  router.put("/updateUser", controller.updateUsers);
  router.post("/createUser", controller.createUser);
  router.put("/changePassword", controller.changePassword);

  router.put("/updateCustomPackage", controller.updateCustomPackage);
  router.get("/getCustomPackage", controller.getCustomPackage);
  router.post("/deleteUser", controller.deleteUser);

  router.post("/addQuota", controller.addQuota);
  router.post("/quotaCharging", controller.quotaCharging);

  router.get("/getRoles", controller.getRoles);
  router.get("/getProfile", controller.getProfile);
};
