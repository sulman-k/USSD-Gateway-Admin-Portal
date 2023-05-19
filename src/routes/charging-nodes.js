module.exports = (router, controller) => {
  router.get("/getChargingNodes", controller.getChargingNodes);
  router.post("/addChargingNode", controller.addChargingNode);
  router.put("/updateChargingNode", controller.updateChargingNode);
  router.delete("/deleteChargingNode/:id", controller.deleteChargingNode);

  router.get("/getDiameterStatus", controller.getDiameterStatus);
  router.post("/addDiameterStatus", controller.addDiameterStatus);
  router.put("/updateDiameterStatus", controller.updateDiameterStatus);
  router.delete("/deleteDiameterStatus/:id", controller.deleteDiameterStatus);
};
