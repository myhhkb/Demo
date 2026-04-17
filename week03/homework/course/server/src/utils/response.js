// success：统一返回成功响应。
// code 约定为 0，表示接口执行成功。
export function success(ctx, data = null, msg = 'success') {
  ctx.body = { code: 0, msg, data };
}

// fail：统一返回失败响应。
// status 同时会作为 HTTP 状态码和业务 code 返回给前端。
export function fail(ctx, status, msg) {
  ctx.status = status;
  ctx.body = { code: status, msg, data: null };
}
