import express from "express";
import { createUserController } from "../controllers/usersController";

const router = express.Router();

router.post('/', createUserController);

export default router;