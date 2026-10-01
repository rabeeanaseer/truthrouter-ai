import express, { type Express } from "express";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import { authMiddleware } from "./middlewares/authMiddleware";
import { isClerkAuthEnabled } from "./lib/authProvider";

const app: Express = express();
const clerkAuthEnabled = isClerkAuthEnabled();

app.set("trust proxy", 1);
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
if (!clerkAuthEnabled) {
  app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (clerkAuthEnabled) {
  app.use(clerkMiddleware());
} else {
  app.use(
    clerkMiddleware((req) => ({
      publishableKey: publishableKeyFromHost(
        getClerkProxyHost(req) ?? "",
        process.env.CLERK_PUBLISHABLE_KEY,
      ),
    })),
  );
}
app.use(authMiddleware);

app.use("/api", router);

export default app;