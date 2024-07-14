const express = require("express");
const router = express.Router();
const Authentication = require("../controllers/Auth.controller");

router.post("/register", Authentication.register);

router.post("/login", Authentication.login);

router.post("/refresh-token", Authentication.refreshToken);

router.delete("/logout", Authentication.logout);

module.exports = router;
