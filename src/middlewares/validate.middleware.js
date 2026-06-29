'use strict';

const { ValidationError } = require('../errors/AppError');

const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return next(new ValidationError('Données invalides', error.details.map((d) => d.message)));
  }

  if (source === 'query') {
    Object.assign(req.query, value);
  } else {
    req[source] = value;
  }
  next();
};

module.exports = validate;
