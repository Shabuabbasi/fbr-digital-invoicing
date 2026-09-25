import { submitInvoice } from "./fbr.client";
import { env } from "../../config/env";
import {
  FbrError,
  FbrNotConfiguredError,
  FbrOutcomeUnknownError,
  FbrRejectedError,
  FbrTimeoutError,
} from "./fbr.errors";
import type { FbrInvoicePayload } from "./fbr.types";

// fetch is always mocked here — these tests never reach FBR (sandbox or production).
const fetchMock = jest.fn();
const payload = { invoiceType: "Sale Invoice", items: [] } as unknown as FbrInvoicePayload;

function jsonResponse(status: number, body: unknown) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  throw new Error("Expected promise to reject");
}

const original = { ...env.fbr };

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  env.fbr.apiToken = "test-token";
  env.fbr.apiBaseUrl = "";
  env.fbr.environment = "SANDBOX";
  env.fbr.timeoutMs = 15000;
});

afterAll(() => {
  Object.assign(env.fbr, original);
});

describe("fbr.client submitInvoice", () => {
  it("returns FBR's invoice number on an explicit success", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        invoiceNumber: "7000007DI1747119701593",
        validationResponse: { statusCode: "00", status: "Valid", error: "", invoiceStatuses: [] },
      }),
    );

    const result = await submitInvoice(payload, "req-1");

    expect(result.fbrReferenceNumber).toBe("7000007DI1747119701593");
    expect(result.fbrResponseStatus).toBe("Valid");
    expect(fetchMock.mock.calls[0][0]).toBe("https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb");
  });

  it("treats an explicit FBR rejection as a definite rejection, not an unknown outcome", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        validationResponse: { statusCode: "01", status: "Invalid", error: "Buyer NTN is invalid", invoiceStatuses: null },
      }),
    );

    const err = await captureError(submitInvoice(payload, "req-2"));

    expect(err).toBeInstanceOf(FbrRejectedError);
    expect(err).not.toBeInstanceOf(FbrOutcomeUnknownError);
    expect((err as FbrError).message).toBe("Buyer NTN is invalid");
  });

  it("treats HTTP 401 as a definite failure", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, ""));

    const err = await captureError(submitInvoice(payload, "req-3"));

    expect(err).toBeInstanceOf(FbrError);
    expect(err).not.toBeInstanceOf(FbrOutcomeUnknownError);
    expect((err as FbrError).code).toBe("FBR_UNAUTHORIZED");
  });

  it("treats a request timeout as an unknown outcome", async () => {
    env.fbr.timeoutMs = 20;
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("This operation was aborted", "AbortError")),
          );
        }),
    );

    const err = await captureError(submitInvoice(payload, "req-4"));

    expect(err).toBeInstanceOf(FbrTimeoutError);
    expect(err).toBeInstanceOf(FbrOutcomeUnknownError);
    expect((err as FbrError).code).toBe("FBR_TIMEOUT");
  });

  it("treats a network failure as an unknown outcome", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const err = await captureError(submitInvoice(payload, "req-5"));

    expect(err).toBeInstanceOf(FbrOutcomeUnknownError);
    expect((err as FbrError).code).toBe("FBR_NETWORK_ERROR");
  });

  it("treats an FBR 5xx as an unknown outcome", async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, "Internal Server Error"));

    const err = await captureError(submitInvoice(payload, "req-6"));

    expect(err).toBeInstanceOf(FbrOutcomeUnknownError);
    expect((err as FbrError).code).toBe("FBR_SERVER_ERROR");
    expect((err as FbrError).httpStatus).toBe(500);
  });

  it("treats a 2xx without a validation result as an unknown outcome", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, "<html>gateway</html>"));

    const err = await captureError(submitInvoice(payload, "req-7"));

    expect(err).toBeInstanceOf(FbrOutcomeUnknownError);
    expect((err as FbrError).code).toBe("FBR_UNRECOGNIZED_RESPONSE");
  });

  it("does not call FBR at all when no token is configured", async () => {
    env.fbr.apiToken = "";

    const err = await captureError(submitInvoice(payload, "req-8"));

    expect(err).toBeInstanceOf(FbrNotConfiguredError);
    expect(err).not.toBeInstanceOf(FbrOutcomeUnknownError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
