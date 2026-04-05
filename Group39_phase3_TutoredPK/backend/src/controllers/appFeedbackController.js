const Joi = require("joi");
const HttpError = require("../utils/httpError");
const appFeedbackService = require("../services/appFeedbackService");

const submitSchema = Joi.object({
  subject: Joi.string().trim().min(3).max(150).required(),
  message: Joi.string().trim().min(10).max(2000).required(),
});

const replySchema = Joi.object({
  reply: Joi.string().trim().min(3).max(2000).required(),
});

exports.submitFeedback = async (req, res) => {
  const { error, value } = submitSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Invalid feedback payload",
      error.details.map((d) => d.message)
    );
  }

  const feedback = await appFeedbackService.submitFeedback({
    accountId: req.user.account_id,
    role: req.user.role,
    subject: value.subject,
    message: value.message,
  });

  res.status(201).json({
    success: true,
    data: {
      feedback,
      message: "Feedback sent successfully",
    },
  });
};

exports.getMyFeedback = async (req, res) => {
  const feedback = await appFeedbackService.getMyFeedback(req.user.account_id);
  res.json({
    success: true,
    data: {
      feedback,
    },
  });
};

exports.getAllFeedback = async (req, res) => {
  const feedback = await appFeedbackService.getAllFeedback();
  res.json({
    success: true,
    data: {
      feedback,
    },
  });
};

exports.replyToFeedback = async (req, res) => {
  const feedbackId = Number(req.params.feedbackId);
  if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid feedback id");
  }

  const { error, value } = replySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Invalid reply payload",
      error.details.map((d) => d.message)
    );
  }

  const feedback = await appFeedbackService.replyToFeedback(feedbackId, value.reply);
  res.json({
    success: true,
    data: {
      feedback,
      message: "Reply sent successfully",
    },
  });
};
