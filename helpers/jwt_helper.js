const JWT = require("jsonwebtoken");
const createErrors = require("http-errors");
const client = require("./init_redis");

module.exports = {
  signAccessToken: async (userId) => {
    try {
      const payload = {};
      const options = {
        expiresIn: "15s",
        audience: userId,
      };
      const token = await new Promise((resolve, reject) => {
        JWT.sign(
          payload,
          process.env.ACCESS_TOKEN_SECRET_KEY,
          options,
          (error, token) => {
            if (error) {
              console.error(error);
              reject(createErrors.InternalServerError());
              return;
            }
            resolve(token);
          }
        );
      });
      return token;
    } catch (error) {
      throw error;
    }
  },
  verifyAccessToken: (req, res, next) => {
    if (!req.headers["authorization"]) return next(createErrors.Unauthorized());
    const authHeader = req.headers["authorization"];
    const bearerToken = authHeader.split(" ");
    const token = bearerToken[1];
    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY, (err, payload) => {
      if (err) {
        const message = (err.name = "JsonWebTokenError"
          ? "Unauthorized"
          : err.message);
        return next(createErrors.Unauthorized(message));
      }
      req.payload = payload;
      next();
    });
  },
  signRefreshToken: async (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.REFRESH_TOKEN_SECRET_KEY;
      const options = {
        expiresIn: "1y",
        audience: userId,
      };

      JWT.sign(payload, secret, options, async (err, token) => {
        if (err) {
          console.error("Error signing refresh token:", err.message);
          reject(createErrors.InternalServerError());
          return;
        }

        try {
          const reply = await client.set(userId, token, 'EX', 365 * 24 * 60 * 60);
          resolve(token);
        } catch (redisErr) {
          console.error("Error setting token in Redis:", redisErr.message);
          reject(createErrors.Unauthorized());
        }
      });
    });
  },
  verifyRefreshToken: async (refreshToken) => {
    return new Promise((resolve, reject) => {
      JWT.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET_KEY,
        async (err, payload) => {
          if (err) {
            console.log(err);
            return reject(createErrors.Unauthorized());
          }

          const userId = payload.aud;

          try {
            const result = await client.get(userId);
            if (refreshToken === result) {
              resolve(userId);
            } else {
              reject(createErrors.Unauthorized());
            }
          } catch (redisErr) {
            console.log(redisErr.message);
            reject(createErrors.Unauthorized());
          }
        }
      );
    });
  },
};
