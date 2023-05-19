const { upload } = require(`${__utils}/file-uploader`);

module.exports = (router, controller) => {
  router.get("/getNodeConfig", controller.getNodeConfig);
  router.post("/addNodeConfig", controller.addNodeConfig);

  router.put("/updateNodeConfigFile", controller.updateNodeConfigFile);
  router.get("/getNodeFiles", controller.getNodeFiles);
  router.put("/updateNodeConfig", controller.updateNodeConfig);

  router.put("/deleteNodeConfig", controller.deleteNodeConfig);

  router.get("/getfileNamesPerNode/:id", controller.getfileNamesPerNode);
};
