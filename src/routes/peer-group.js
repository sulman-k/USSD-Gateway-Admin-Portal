module.exports = (router, controller) => {
  router.get("/getPeerGroups", controller.getPeerGroups);
  router.post("/addPeerGroup", controller.addPeerGroup);
  router.put("/updatePeerGroup", controller.updatePeerGroup);
  router.delete("/deletePeerGroup/:id", controller.deletePeerGroup);
};
