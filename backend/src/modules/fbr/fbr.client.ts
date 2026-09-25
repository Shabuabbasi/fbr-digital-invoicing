import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import {
  FbrNotConfiguredError,
  FbrOutcomeUnknownError,
  FbrRejectedError,
  FbrTimeoutError,
  FbrError,
} from "./fbr.errors";
import type {
  FbrInvoicePayload,
  FbrPostInvoiceResponse,
  FbrSubmitResult,
} from "./fbr.types";

// Real FBR Digital Invoicing "Post" endpoint — see PRAL Technical Specification for DI API
// v1.12 §4.1 and docs/FBR-INTEGRATION.md. URL routing (sandbox vs production) is driven by
// which security token is used, per FBR's docs, but we also key off FBR_ENVIRONMENT so the
// correct URL is used even before a token is configured.
const POST_INVOICE_URL: Record<"SANDBOX" | "PRODUCTION", string> = {
  SANDBOX: "https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb",
  PRODUCTION: "https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata",
};

export async function submitInvoice(
  payload: FbrInvoicePayload,
  requestId: string,
): Promise<FbrSubmitResult> {
  if (!env.fbr.apiToken) {
    throw new FbrNotConfiguredError();
  }

  const url = env.fbr.apiBaseUrl || POST_INVOICE_URL[env.fbr.environment];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.fbr.timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.fbr.apiToken}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const httpStatus = response.status;
    const rawBody = await response.text();
    let body: FbrPostInvoiceResponse | undefined;
    if (rawBody.trim()) {
      try {
        body = JSON.parse(rawBody) as FbrPostInvoiceResponse;
        logger.info("FBR Response", { requestId, httpStatus, response: body });
      } catch {
        logger.error("FBR returned a non-JSON response", {
          requestId,
          httpStatus,
          contentType: response.headers.get("content-type"),
          responseBody: rawBody.slice(0, 2000),
        });
      }
    }

    if (httpStatus === 401) {
      throw new FbrError(
        "FBR rejected the request: invalid or expired security token",
        "FBR_UNAUTHORIZED",
        false,
        httpStatus,
      );
    }
    // A 5xx does not tell us whether FBR stored the invoice before failing (spec v1.12 §4.1.6
    // only says "Internal Server Error (Contact Administrator)"), so the outcome is unknown.
    if (httpStatus >= 500) {
      throw new FbrOutcomeUnknownError(
        `FBR internal server error (HTTP ${httpStatus})`,
        "FBR_SERVER_ERROR",
        httpStatus,
      );
    }

    const validation = body?.validationResponse;

    // A 2xx without a validation result is not a response we can interpret as accept or reject.
    if (httpStatus >= 200 && httpStatus < 300 && !validation) {
      throw new FbrOutcomeUnknownError(
        `FBR returned HTTP ${httpStatus} without a validation result`,
        "FBR_UNRECOGNIZED_RESPONSE",
        httpStatus,
      );
    }
    const isValid =
      validation?.statusCode === "00" &&
      validation?.status?.toLowerCase() === "valid";

    if (!validation || !isValid) {
      const firstItemError = validation?.invoiceStatuses?.find(
        (s) => s.statusCode !== "00",
      );
      const errorMessage =
        validation?.error ||
        firstItemError?.error ||
        body?.error ||
        body?.message ||
        rawBody.trim() ||
        `FBR rejected the invoice (HTTP ${httpStatus})`;
      throw new FbrRejectedError(errorMessage, httpStatus);
    }

    return {
      httpStatus,
      fbrResponseStatus: validation.status,
      fbrReferenceNumber:
        body?.invoiceNumber ??
        validation.invoiceStatuses?.[0]?.invoiceNo ??
        null,
      errorCode: null,
      errorMessage: null,
    };
  } catch (err) {
    if (err instanceof FbrError) throw err;
    // Checked by name: fetch's abort error is a DOMException, which may not pass instanceof checks.
    if ((err as { name?: unknown } | null)?.name === "AbortError") {
      throw new FbrTimeoutError();
    }
    logger.error("Unexpected error calling FBR API", {
      requestId,
      message: err instanceof Error ? err.message : String(err),
    });
    // Network failure / dropped connection: the request may already have reached FBR.
    throw new FbrOutcomeUnknownError(
      "Network error contacting FBR",
      "FBR_NETWORK_ERROR",
    );
  } finally {
    clearTimeout(timeout);
  }
}
