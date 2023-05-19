module.exports = (router, controller) => {
  router.get("/getHttpConfigs", controller.getHttpConfigs);
  router.post("/addHttpConfig", controller.addHttpConfig);
  router.put("/updateHttpConfig/:id", controller.updateHttpConfig);
  router.delete("/deleteHttpConfig/:id", controller.deleteHttpConfig);
  router.put("/updateActiveStatus", controller.updateActiveStatus);
};
