import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config(); //

const router = express.Router();
const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET_KEY;

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });

    if (exists)
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    if (!hashed)
      return res
        .status(500)
        .json({ success: false, message: "server Internal Issue" });

    const user = await prisma.user.create({
      data: { email, password: hashed },
    });
    return res.json({
      success: true,
      message: "user register successful",
      data: user,
    });
  } catch (err) {
    console.error("error during rejistration", err);
    return res.status(500).json({
      success: false,
      message: "server internal problem,please try later",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res
        .status(401)
        .json({ success: false, message: "invalid credential" });

    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "1h" });
    if (!token)
      return res
        .status(500)
        .json({ success: false, message: "server internal problem" });

    return res.json({
      success: true,
      message: "Login Successful",
      token: token,
    });
  } catch (err) {
    console.error("Error during login", err);
    return res
      .status(500)
      .json({ error: "Server Internal Problem,please try later" });
  }
});

export default router;
