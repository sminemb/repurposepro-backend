import { Router } from "express";

import { generalApiProtection } from "../middlewares/arcjet.middleware.js";
import { jobsRouter } from "./jobs.routes.js";
import { meRouter } from "./me.routes.js";
import { projectsRouter } from "./projects.routes.js";
import { videosRouter } from "./videos.routes.js";

export const apiRouter = Router();

apiRouter.use("/me", generalApiProtection, meRouter);
apiRouter.use("/projects", generalApiProtection, videosRouter);
apiRouter.use(jobsRouter);
apiRouter.use("/projects", generalApiProtection, projectsRouter);
