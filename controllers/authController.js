const bcrypt = require("bcryptjs");
const passport = require("passport");
const { findUserByEmail, createUser } = require("../services");
const { body, validationResult } = require("express-validator");

exports.validateSignUp = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address.")
    .normalizeEmail()
    .custom(async (value) => {
      const user = await findUserByEmail(value);
      if (user) throw new Error("E-mail already in use.");
    }),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match.");
    }
    return true;
  }),
];

exports.getSignUp = (req, res) => {
  res.render("sign-up");
};

exports.getLogin = (req, res) => {
  const errors = req.session.messages || [];
  req.session.messages = [];
  res.render("login", { errors });
};

exports.postLogout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
};

exports.postSignUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("sign-up", {
      errors: errors.array(),
      formData: req.body,
    });
  }

  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await createUser({ email, hashedPassword });

  req.login(user, (err) => {
    if (err) return next(err);

    req.session.save((saveErr) => {
      if (saveErr) return next(saveErr);
      return res.redirect("/folders");
    });
  });
};

exports.postLogin = passport.authenticate("local", {
  successRedirect: "/folders",
  failureRedirect: "/login",
  failureMessage: true,
});
