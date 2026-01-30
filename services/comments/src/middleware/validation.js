const Joi = require('joi');
const { ValidationError } = require('common');

const createSchema = Joi.object({
  productId: Joi.string().required(),
  body: Joi.string().min(1).trim().required(),
  parentId: Joi.string().allow(null),
  rating: Joi.number().min(1).max(5),
});

const updateSchema = Joi.object({
  body: Joi.string().min(1).trim().required(),
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
