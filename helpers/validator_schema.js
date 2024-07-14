const joi = require("@hapi/joi");

const authSchema = joi.object({
  email: joi.string().email().lowercase().required(),
  password: joi.string().min(2).max(10).required(),
});

module.exports = {
  authSchema
};
