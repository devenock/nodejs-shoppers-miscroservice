const Joi = require('joi');
const { ValidationError } = require('common');

const createSchema = Joi.object({
  name: Joi.string().min(1).trim().required(),
  description: Joi.string().trim().allow(''),
  price: Joi.number().min(0).required(),
  inventory: Joi.number().integer().min(0).required(),
  category: Joi.string().min(1).trim().required(),
});

const updateSchema = Joi.object({
  name: Joi.string().min(1).trim(),
  description: Joi.string().trim().allow(''),
  price: Joi.number().min(0),
  inventory: Joi.number().integer().min(0),
  category: Joi.string().min(1).trim(),
}).min(1);

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) return next(new ValidationError(error.details[0].message));
    req.validated = value;
    next();
  };
}

module.exports = {
  validateCreate: validate(createSchema),
  validateUpdate: validate(updateSchema),
};
