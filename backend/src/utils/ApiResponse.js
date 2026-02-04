/**
 * Simple API response wrapper.
 * You can standardize all responses using this class.
 */
export default class ApiResponse {
  constructor(statusCode, data = null, message = "success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
