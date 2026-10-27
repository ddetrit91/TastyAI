import type { ContentfulStatusCode } from "hono/utils/http-status";

export function statusOf(code: number): ContentfulStatusCode {
  return code as ContentfulStatusCode;
}
