import { AxiosError } from "axios";

export interface ParsedApiError {
  message: string;
  code?: string;
  traceId?: string;
}

const FALLBACK_MESSAGE = "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
const NETWORK_MESSAGE = "네트워크 연결을 확인하고 다시 시도해주세요.";

// status 0은 "서버 응답이 없음"(네트워크 오류 등)을 뜻한다.
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly traceId?: string;

  constructor(
    status: number,
    message: string,
    code?: string,
    traceId?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.traceId = traceId;
  }
}

interface ErrorContractBody {
  code?: unknown;
  message?: unknown;
  traceId?: unknown;
}

/** axios가 던진 오류를 서버 공통 에러 계약({ code, message, traceId })에 맞춰 ApiError로 정규화한다. */
export function toApiError(error: unknown): ApiError {
  if (!(error instanceof AxiosError)) {
    return new ApiError(0, FALLBACK_MESSAGE);
  }

  const response = error.response;
  if (!response) {
    return new ApiError(0, NETWORK_MESSAGE);
  }

  const body: ErrorContractBody =
    typeof response.data === "object" && response.data !== null
      ? (response.data as ErrorContractBody)
      : {};

  return new ApiError(
    response.status,
    typeof body.message === "string" ? body.message : FALLBACK_MESSAGE,
    typeof body.code === "string" ? body.code : undefined,
    typeof body.traceId === "string" ? body.traceId : undefined,
  );
}

export function parseApiError(err: unknown): ParsedApiError {
  if (err instanceof ApiError) {
    return { message: err.message, code: err.code, traceId: err.traceId };
  }

  // TODO(Task 8): apiFetch 제거 후 아래 문자열 파싱 분기를 삭제한다.
  if (err instanceof Error) {
    // apiFetch throw 형식: "API 4xx: <body-text>"
    const bodyMatch = err.message.match(/^API \d+: ([\s\S]+)$/);
    if (bodyMatch) {
      try {
        const parsed = JSON.parse(bodyMatch[1]) as {
          code?: unknown;
          message?: unknown;
          traceId?: unknown;
        };
        if (typeof parsed.message === "string") {
          return {
            message: parsed.message,
            code: typeof parsed.code === "string" ? parsed.code : undefined,
            traceId:
              typeof parsed.traceId === "string" ? parsed.traceId : undefined,
          };
        }
      } catch {
        // body가 JSON이 아닌 경우 — fallthrough
      }
    }
    if (
      err.message.includes("Failed to fetch") ||
      err.message.includes("NetworkError") ||
      err.message.includes("fetch")
    ) {
      return {
        message: NETWORK_MESSAGE,
      };
    }
  }
  return {
    message: FALLBACK_MESSAGE,
  };
}
