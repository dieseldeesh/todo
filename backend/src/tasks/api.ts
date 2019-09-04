import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as express from "express";
import { model } from "./model";

export const router = express.Router();

router.use(bodyParser.json());

// options for cors midddleware
const options: cors.CorsOptions = {
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "X-Access-Token", "fetch-user-agent"],
    credentials: true,
    methods: "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
    origin: "*",
    preflightContinue: false,
};

router.use(cors(options));
router.options("*", cors(options));

/**
 * GET /api/tasks
 *
 * Retrieve a page of tasks (up to ten at a time).
 */
router.get("/incomplete", (req: any, res: any, next: any) => {
    model.listInComplete(10, req.query.pageToken, (err: any, entities: any, cursor: any) => {
        if (err) {
            next(err);
            return;
        }
        res.json({
            items: entities,
            nextPageToken: cursor,
        });
    });
});

router.get("/completed", (req: any, res: any, next: any) => {
    model.listCompleted(10, req.query.pageToken, (err: any, entities: any, cursor: any) => {
        if (err) {
            next(err);
            return;
        }
        res.json({
            items: entities,
            nextPageToken: cursor,
        });
    });
});

/**
 * POST /api/tasks
 *
 * Create a new task.
 */
router.post("/add", (req: any, res: any, next: any) => {
    model.create(req.body, (err: any, entity: any) => {
        if (err) {
            next(err);
            return;
        }
        res.json(entity);
    });
});

/**
 * GET /api/tasks/:id
 *
 * Retrieve a task.
 */
router.get("/:taskId", (req: any, res: any, next: any) => {
    model.read(req.params.taskId, (err: any, entity: any) => {
        if (err) {
            next(err);
            return;
        }
        res.json(entity);
    });
});

/**
 * PUT /api/tasks/:id
 *
 * Update a task.
 */
router.post("/edit/:taskId", (req: any, res: any, next: any) => {
    model.update(req.params.taskId, req.body, (err: any, entity: any) => {
        if (err) {
            next(err);
            return;
        }
        res.json(entity);
    });
});

/**
 * DELETE /api/tasks/:id
 *
 * Delete a task.
 */
router.post("/delete/:task", (req: any, res: any, next: any) => {
    model.delete(req.params.task, (err: any) => {
        if (err) {
            next(err);
            return;
        }
        res.status(200).send("OK");
    });
});

/**
 * Errors on "/api/tasks/*" routes.
 */
router.use((err: any, req: any, res: any, next: any) => {
    // Format error and forward to generic error handler for logging and
    // responding to the request
    err.response = {
        internalCode: err.code,
        message: err.message,
    };
    next(err);
});
