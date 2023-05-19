module.exports = (router, controller) => {
  router.get("/getChargingPeers", controller.getChargingPeers);
  router.post("/addChargingPeer", controller.addChargingPeer);
  router.put("/updateChargingPeer", controller.updateChargingPeer);
  router.delete("/deleteChargingPeer/:id", controller.deleteChargingPeer);

  router.get("/getPeersById/:type", controller.getPeersById);
};
