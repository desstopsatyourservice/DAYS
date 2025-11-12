import { Router } from "express";
import {
  listAmis,
  listInstances,
  addInstance,
  deleteInstance,
  startInstance,
  stopInstance,
} from "../services/ec2Service";

const router = Router();

router.get("/list", async (req, res) => {
  const instances = await listInstances();
  res.json(instances);
});

router.post("/add", async (req: any, res) => {
  const amis = addInstance(
    req.body.amiId,
    req.body.keyName,
    req.body.pricingTier
  );
  res.json(amis);
});

router.post("/delete", async (req: any, res) => {
  const amis = await deleteInstance(req.body.keyName, req.body.instanceId);
  res.json(amis);
});

router.get("/amis", async (req, res) => {
  const amis = await listAmis();
  res.json(amis);
});

export default router;
