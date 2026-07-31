export const validation = (schema) => {
  return (req, res, next) => {
    try {
      const errors = [];

      for (const [key, validator] of Object.entries(schema)) {

        // Skip missing request parts
        if (req[key] === undefined || req[key] === null) {
          continue;
        }

        const result = validator.safeParse(req[key]);

        if (!result.success) {

          result.error.issues.forEach((err) => {
            errors.push({
              field: err.path.length
                ? err.path.join(".")
                : key,
              message: err.message,
            });
          });

        } else {
          // In Express 5 `req.query` is a getter-only property, so reassigning
          // it throws. Body/params are writable; for query we skip the rewrite
          // (downstream handlers read/coerce req.query directly).
          try {
            req[key] = result.data;
          } catch {
            /* query is read-only on Express 5 — validation still ran above */
          }
        }
      }

      if (errors.length > 0) {

        // remove duplicates
        const uniqueErrors = [
          ...new Map(
            errors.map((e) => [
              `${e.field}-${e.message}`,
              e
            ])
          ).values(),
        ];

        return res.status(400).json({
          message: "Validation failed",
          errors: uniqueErrors,
        });
      }

      next();

    } catch (error) {
      return res.status(500).json({
        message: "Validation middleware error",
        error: error.message,
      });
    }
  };
};