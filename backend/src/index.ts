const PORT = Number(process.env.PORT) || 8080;
import * as express from "express";
import * as path from "path";
import { router as taskApiRouter } from "./tasks/api";

const app = express();

app.disable("etag");
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.set("trust proxy", true);

// Books
app.use("/api/tasks", taskApiRouter);

// Basic 404 handler
app.use((req: any, res: any) => {
    res.status(404).send("Not Found");
});

// Basic error handler
app.use((err: any, req: any, res: any) => {
    /* jshint unused:false */
    console.error(err);
    // If our routes specified a specific response, then send that. Otherwise,
    // send a generic message so as not to leak anything.
    res.status(500).send(err.response || "Something broke!");
});

app.listen(PORT, () => {
    console.log(`App listening on port http://localhost:${PORT}`);
});
