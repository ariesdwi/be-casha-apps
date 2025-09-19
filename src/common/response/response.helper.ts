// // src/common/response/response.helper.ts

// export interface ApiResponse<T> {
//   code: number;
//   status: 'success' | 'error';
//   message: string;
//   data: T | null;
// }

// /**
//  * Success response wrapper
//  */
// export function successResponse<T>(
//   data: T,
//   message = 'Success',
//   code = 200,
// ): ApiResponse<T> {
//   return {
//     code,
//     status: 'success',
//     message,
//     data,
//   };
// }

// /**
//  * Error response wrapper
//  */
// export function errorResponse(
//   message = 'Error',
//   code = 400,
// ): ApiResponse<null> {
//   return {
//     code,
//     status: 'error',
//     message,
//     data: null,
//   };
// }
