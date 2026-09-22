import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import {
  FbrNotConfiguredError,
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
    let body: FbrPostInvoiceResponse | undefined;
    try {
      body = (await response.json()) as FbrPostInvoiceResponse;
    } catch {
      // Non-JSON body (e.g. a gateway error page) — fall through with body undefined.
    }

    if (httpStatus === 401) {
      throw new FbrError(
        "FBR rejected the request: invalid or expired security token",
        "FBR_UNAUTHORIZED",
        false,
      );
    }
    if (httpStatus >= 500) {
      throw new FbrError(
        `FBR internal server error (HTTP ${httpStatus})`,
        "FBR_SERVER_ERROR",
        true,
      );
    }

    const validation = body?.validationResponse;
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
        `FBR rejected the invoice (HTTP ${httpStatus}): ${JSON.stringify(body)}`;
      throw new FbrRejectedError(errorMessage);
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
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new FbrTimeoutError();
    }
    logger.error("Unexpected error calling FBR API", {
      requestId,
      message: err instanceof Error ? err.message : String(err),
    });
    throw new FbrError(
      "Unexpected error contacting FBR",
      "FBR_UNKNOWN_ERROR",
      true,
    );
  } finally {
    clearTimeout(timeout);
  }
}
