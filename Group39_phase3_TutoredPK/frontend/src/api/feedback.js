import apiClient from "./client";

function unwrap(response) {
  return response.data?.data || response.data;
}

export async function submitAppFeedbackRequest(payload) {
  const response = await apiClient.post("/app-feedback", payload);
  return unwrap(response);
}

export async function myAppFeedbackRequest() {
  const response = await apiClient.get("/app-feedback/my");
  return unwrap(response);
}

export async function adminAppFeedbackRequest() {
  const response = await apiClient.get("/app-feedback/admin");
  return unwrap(response);
}

export async function adminReplyFeedbackRequest(feedbackId, payload) {
  const response = await apiClient.patch(`/app-feedback/admin/${feedbackId}/reply`, payload);
  return unwrap(response);
}
