const express = require("express");
const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");
const subscriptionController = require("../controllers/subscriptionController");

const router = express.Router();

router.get("/plans", subscriptionController.getPlans);
router.get("/tutor/status", auth, rbac("tutor"), subscriptionController.getTutorStatus);
router.post("/tutor/topup", auth, rbac("tutor"), subscriptionController.topupTutorWallet);
router.post("/tutor/purchase", auth, rbac("tutor"), subscriptionController.purchaseTutorPlan);
router.get("/tutor/my", auth, rbac("tutor"), subscriptionController.getMySubscriptions);

module.exports = router;
