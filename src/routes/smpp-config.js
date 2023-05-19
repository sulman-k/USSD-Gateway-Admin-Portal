module.exports = (router, controller) => {
  router.get("/getSmppIps", controller.getSmppIps);
  router.put("/deleteSmppIp/:id", controller.deleteSmppIp);
  router.post("/addSmppIp", controller.addSmppIp);
  router.put("/updateSmppIp/:id", controller.updateSmppIp);

  router.get("/getSmppPorts", controller.getSmppPorts);
  router.put("/deleteSmppPort/:id/:smpp_id", controller.deleteSmppPort);
  router.post("/addSmppPort", controller.addSmppPort);
  router.put("/updateSmppPort", controller.updateSmppPort);

  //when binding esme only show ports of selected ip
  router.get("/getSmppIpPorts/:id", controller.getSmppIpPorts);
  router.post("/esmePortIpBinding", controller.esmePortIpBinding);

  router.post("/addEsmeConfiguration", controller.addEsmeConfiguration);
  router.get("/getEsmeConfiguration", controller.getEsmeConfiguration);
  router.put("/updateEsmeConfiguration", controller.updateEsmeConfiguration);
  router.put(
    "/deleteEsmeConfigurations/:id",
    controller.deleteEsmeConfigurations
  );

  router.post("/addTlv", controller.addTlv);
  router.get("/getTlv", controller.getTlv);
  router.put("/updateTlv", controller.updateTlv);
  router.put("/deleteTlv/:id", controller.deleteTlv);
};
