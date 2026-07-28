const { Router } = require("express");
const authController = require("../controllers/authController");
const { isAuth, isGuest } = require("../middleware/auth");

const authRouter = Router();

authRouter.get("/login", isGuest, authController.getLogin);
authRouter.get("/sign-up", isGuest, authController.getSignUp);

authRouter.post("/login", isGuest, authController.postLogin);
authRouter.post(
  "/sign-up",
  isGuest,
  authController.validateSignUp,
  authController.postSignUp,
);
authRouter.post("/logout", isAuth, authController.postLogout);

module.exports = authRouter;
