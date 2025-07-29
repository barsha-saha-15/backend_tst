import express from "express";
import { PrismaClient } from "@prisma/client";
import verifyToken from "../middleware/auth.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const router = express.Router();
const prisma = new PrismaClient();

router.post("/add", verifyToken, async (req, res) => {
  const { content } = req.body;
  console.log("Token user ID:", req.userId);
  try {
    const newPost = await prisma.post.create({
      data: {
        content,
        userId: req.userId.userId,
      },
    });

    return res.status(200).json({ success: true, post: newPost });
  } catch (err) {
    console.error("Add Post Error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to add post" });
  }
});

router.get("/home", verifyToken, async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: { userId: req.userId.userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, posts });
  } catch (err) {
    console.error("Fetch user posts error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch posts" });
  }
});

router.get("/singlePost/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id, userId: req.userId.userId },
    });

    res.json({ success: true, post });
  } catch (err) {
    console.error("Fetch user posts error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch posts" });
  }
});

router.delete("/delete/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.post.delete({
      where: { id, userId: req.userId.userId },
    });
    return res
      .status(200)
      .json({ message: "Post deleted successfully", success: true });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Post deletion failed",
      details: error.message,
    });
  }
});

router.put("/update/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body; // <-- FIXED LINE
  try {
    await prisma.post.update({
      where: {
        id,
        userId: req.userId.userId,
      },
      data: {
        content,
      },
    });
    return res
      .status(200)
      .json({ message: "post updated successfully", success: true });
  } catch (error) {
    console.error("update error:", error);
    res.status(400).json({
      success: false,
      error: "post update failed",
      details: error.message,
    });
  }
});

router.get("/allPost", verifyToken, async (req, res) => {
  const userId = req.userId.userId; // fix destructuring
  try {
    const allPost = await prisma.post.findMany({
      where: {
        userId: { not: userId }, // Exclude posts by current user
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json({
      success: true,
      posts: allPost,
    });
  } catch (error) {
    console.error("all post fetch error:", error);
    res.status(500).json({
      success: false,
      message: "failed to fetch all post",
    });
  }
});

router.post("/checkGrammar", verifyToken, async (req, res) => {
  const { content } = req.body;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });
    const prompt = `Correct the following sentence for grammar and return only the corrected sentence:\n\n"${content}"`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const corrected = response.text().trim();

    return res.status(200).json({
      success: true,
      message: "Grammar corrected",
      corrected,
    });
  } catch (error) {
    console.error("Grammar check error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check grammar",
    });
  }
});

export default router;
