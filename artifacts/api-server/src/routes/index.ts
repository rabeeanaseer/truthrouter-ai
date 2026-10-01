import { Router, type IRouter } from "express";
import healthRouter from "./health";
import verdictsRouter from "./verdicts";
import accountRouter from "./account";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(accountRouter);
router.use(verdictsRouter);

export default router;
