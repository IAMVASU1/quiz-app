/**
 * Wrap async route handlers to forward errors to express error middleware.
 * Usage: router.get('/', asyncHandler(async (req,res)=>{ ... }));
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };
};

export default asyncHandler;
