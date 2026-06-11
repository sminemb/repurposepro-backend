import supertest from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import {
  type ApiSuccess,
  ApiTestHarness,
  INTEGRATION_TEST_TIMEOUT_MS,
  type ProjectData,
} from "./api-test-harness.js";

let harness: ApiTestHarness;

beforeAll(async () => {
  harness = await ApiTestHarness.create({
    name: "auth-projects",
  });
  await harness.signUpAndSignIn();
}, INTEGRATION_TEST_TIMEOUT_MS);

afterAll(async () => {
  await harness.cleanup();
}, INTEGRATION_TEST_TIMEOUT_MS);

describe("RepurposePro health, auth, and project API", () => {
  test(
    "reports health and protects authenticated routes",
    async () => {
      const healthResponse = await supertest(harness.app)
        .get("/api/health")
        .expect(200);

      expect(healthResponse.body).toMatchObject({
        success: true,
        message: "RepurposePro API Gateway is running",
        data: {
          service: "api-gateway",
          status: "healthy",
        },
      });

      await supertest(harness.app).get("/api/me").expect(401);
      await supertest(harness.app).get("/api/projects").expect(401);
    },
    INTEGRATION_TEST_TIMEOUT_MS,
  );

  test(
    "returns the authenticated user",
    async () => {
      const response = await harness.expectAuthenticatedRequest(
        () => harness.agent.get("/api/me").set("Origin", harness.trustedOrigin),
        200,
      );

      expect(response.body).toMatchObject({
        success: true,
        message: "Authenticated user retrieved successfully",
        data: {
          user: {
            email: harness.email,
            role: "creator",
          },
        },
      });
      expect(response.body.data.session).toBeUndefined();
    },
    INTEGRATION_TEST_TIMEOUT_MS,
  );

  test(
    "supports project CRUD and video upload",
    async () => {
      const createdProject = await harness.createProject("Integration Project");

      expect(createdProject.status).toBe("draft");

      const projectListResponse = await harness.expectAuthenticatedRequest(
        () =>
          harness.agent
            .get("/api/projects")
            .set("Origin", harness.trustedOrigin),
        200,
      );
      const projects = (
        projectListResponse.body as ApiSuccess<ProjectData[]>
      ).data;

      expect(projects.some((project) => project.id === createdProject.id)).toBe(
        true,
      );

      const updateProjectResponse = await harness.expectAuthenticatedRequest(
        () =>
          harness.agent
            .patch(`/api/projects/${createdProject.id}`)
            .set("Origin", harness.trustedOrigin)
            .send({
              title: "Updated Integration Project",
            }),
        200,
      );

      expect(
        (updateProjectResponse.body as ApiSuccess<ProjectData>).data.title,
      ).toBe("Updated Integration Project");

      const uploadedProject = await harness.uploadProjectVideo(
        createdProject.id,
      );

      expect(uploadedProject.status).toBe("uploaded");
      expect(uploadedProject.originalVideoUrl).toBeTruthy();

      await harness.expectAuthenticatedRequest(
        () =>
          harness.agent
            .delete(`/api/projects/${createdProject.id}`)
            .set("Origin", harness.trustedOrigin),
        200,
      );

      await harness.expectAuthenticatedRequest(
        () =>
          harness.agent
            .get(`/api/projects/${createdProject.id}`)
            .set("Origin", harness.trustedOrigin),
        404,
      );
    },
    INTEGRATION_TEST_TIMEOUT_MS,
  );
});
