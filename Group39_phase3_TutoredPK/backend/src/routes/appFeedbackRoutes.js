const express = require("express");
const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");
const appFeedbackController = require("../controllers/appFeedbackController");

const router = express.Router();

router.post("/", auth, rbac("student", "tutor", "academy"), appFeedbackController.submitFeedback);
router.get("/my", auth, rbac("student", "tutor", "academy"), appFeedbackController.getMyFeedback);
router.get("/admin", auth, rbac("admin"), appFeedbackController.getAllFeedback);
router.patch("/admin/:feedbackId/reply", auth, rbac("admin"), appFeedbackController.replyToFeedback);

module.exports = router;
