import { describe, expect, test } from "vitest";

import {
  projectIdParamSchema,
  updateProjectBodySchema,
} from "../validators/project.validator.js";

describe("project validation", () => {
  test("rejects empty project updates", () => {
    expect(updateProjectBodySchema.safeParse({}).success).toBe(false);
  });

  test("trims and bounds project IDs", () => {
    expect(projectIdParamSchema.parse({ id: " project-1 " })).toEqual({
      id: "project-1",
    });
    expect(
      projectIdParamSchema.safeParse({
        id: "x".repeat(129),
      }).success,
    ).toBe(false);
  });
});
