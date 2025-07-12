/**
 * Handle API errors and return standardized error response
 */
const handleApiError = (error) => {
  const errorResponse = {
    success: false,
    message: 'Có lỗi xảy ra',
    error: {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred'
    }
  };

  // Handle specific AWS errors
  if (error.code) {
    switch (error.code) {
      case 'ResourceNotFoundException':
        errorResponse.message = 'Không tìm thấy tài nguyên';
        errorResponse.error.userMessage = 'Resource không tồn tại hoặc đã bị xóa';
        break;
      case 'AccessDeniedException':
        errorResponse.message = 'Không có quyền truy cập';
        errorResponse.error.userMessage = 'Bạn không có quyền thực hiện hành động này';
        break;
      case 'ValidationException':
        errorResponse.message = 'Dữ liệu không hợp lệ';
        errorResponse.error.userMessage = 'Vui lòng kiểm tra lại thông tin đầu vào';
        break;
      case 'ThrottlingException':
        errorResponse.message = 'Quá nhiều yêu cầu';
        errorResponse.error.userMessage = 'Vui lòng thử lại sau ít phút';
        break;
      case 'InternalServerException':
        errorResponse.message = 'Lỗi server nội bộ';
        errorResponse.error.userMessage = 'Có lỗi xảy ra từ phía server, vui lòng thử lại';
        break;
      default:
        errorResponse.message = error.message || 'Có lỗi xảy ra';
    }
  }

  // Handle network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    errorResponse.message = 'Không thể kết nối đến dịch vụ';
    errorResponse.error.userMessage = 'Vui lòng kiểm tra kết nối mạng';
  }

  // Handle timeout errors
  if (error.code === 'ETIMEDOUT') {
    errorResponse.message = 'Hết thời gian chờ';
    errorResponse.error.userMessage = 'Yêu cầu mất quá nhiều thời gian, vui lòng thử lại';
  }

  return errorResponse;
};

/**
 * Handle validation errors
 */
const handleValidationError = (errors) => {
  return {
    success: false,
    message: 'Dữ liệu không hợp lệ',
    errors: errors.map(error => ({
      field: error.path,
      message: error.message,
      value: error.value
    }))
  };
};

/**
 * Handle async errors in Express routes
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  console.error('Global error handler:', err);

  // Default error response
  let statusCode = 500;
  let errorResponse = handleApiError(err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorResponse = handleValidationError(err.details);
  } else if (err.statusCode) {
    statusCode = err.statusCode;
  } else if (err.code === 'ResourceNotFoundException') {
    statusCode = 404;
  } else if (err.code === 'AccessDeniedException') {
    statusCode = 403;
  } else if (err.code === 'ValidationException') {
    statusCode = 400;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 errors
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy endpoint',
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  });
};

module.exports = {
  handleApiError,
  handleValidationError,
  asyncHandler,
  globalErrorHandler,
  notFoundHandler
}; 