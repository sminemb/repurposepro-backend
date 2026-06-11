import express from "express";
import supertest from "supertest";
import { describe, expect, test } from "vitest";

import { uploadSingleVideo } from "../middlewares/upload.middleware.js";

const app = express();

app.post("/upload", uploadSingleVideo, (_request, response) => {
  response.status(204).send();
});

describe("video upload middleware", () => {
  test("rejects unsupported extensions", async () => {
    const response = await supertest(app)
      .post("/upload")
      .attach("video", Buffer.from("not a video"), {
        filename: "source.exe",
        contentType: "video/mp4",
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid video file type. Allowed types: mp4, mov, mkv, webm",
    });
  });

  test("rejects unsupported MIME types and unexpected fields", async () => {
    const invalidMimeResponse = await supertest(app)
      .post("/upload")
      .attach("video", Buffer.from("not a video"), {
        filename: "source.mp4",
        contentType: "application/octet-stream",
      })
      .expect(400);
    const unexpectedFieldResponse = await supertest(app)
      .post("/upload")
      .attach("file", Buffer.from("not a video"), {
        filename: "source.mp4",
        contentType: "video/mp4",
      })
      .expect(400);

    expect(invalidMimeResponse.body.success).toBe(false);
    expect(unexpectedFieldResponse.body).toMatchObject({
      success: false,
      message: 'Only a single video file field named "video" is allowed',
    });
  });
});
