const createErrors = require("http-errors");
const { authSchema } = require("../helpers/validator_schema");
const User = require("../model/user.model");

const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../helpers/jwt_helper");
const client = require("../helpers/init_redis");

module.exports = {
  register: async (req, res, next) => {
    try {
      const result = await authSchema.validateAsync(req.body);
      const doesExist = await User.findOne({ email: result.email });
      if (doesExist)
        throw createErrors.Conflict(
          `${result.email} is already been registered`
        );

      const user = new User(result);
      const savedUser = await user.save();
      const accessToken = await signAccessToken(savedUser.id);
      const refreshToken = await signRefreshToken(savedUser.id);
      res.send({ accessToken, refreshToken });
    } catch (error) {
      console.log(error);
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },
  login: async (req, res, next) => {
    try {
      const result = await authSchema.validateAsync(req.body);
      const user = await User.findOne({ email: result.email });
      if (!user) throw createErrors.NotFound("User not found");

      const isMatch = await user.isValidaPassword(result.password);
      if (!isMatch)
        throw createErrors.Unauthorized("username/password is invalid");

      const accessToken = await signAccessToken(user.id);
      const refreshToken = await signRefreshToken(user.id);
      res.send({ accessToken, refreshToken });
    } catch (error) {
      if (error.isJoi === true) error.status = 422;
      next(error);
    }
  },
  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      const userId = await verifyRefreshToken(refreshToken);
      if (!refreshToken) {
        throw createErrors.BadRequest();
      }
      const accessToken = await signAccessToken(userId);
      const refToken = await signRefreshToken(userId);

      res.send({ accessToken, refToken });
    } catch (error) {
      next(error);
    }
  },
  logout: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw createErrors.BadRequest();
      const userId = await verifyRefreshToken(refreshToken);

      const deleletFromRedis = await client.DEL(userId);
      console.log(deleletFromRedis);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  },
};
