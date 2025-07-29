import jwt from "jsonwebtoken";

const secretkey = process.env.JWT_SECRET_KEY;

export default function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ message: "unauthorized user, please login first" });

  jwt.verify(token, secretkey, (err, userId) => {
    if (err) {
      console.log(err);
      return res
        .status(403)
        .json({ message: "Invalid Credential, please login" });
    }
    req.userId = userId;
    next();
  });
}
