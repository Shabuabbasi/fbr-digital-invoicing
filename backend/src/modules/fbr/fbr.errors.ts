export class FbrError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean,
    public httpStatus?: number,
  ) {
    super(message);
    this.name = "FbrError";
  }
}

// Thrown by fbr.client when FBR_API_TOKEN is not set. The endpoint/payload contract is
// implemented against FBR's real Digital Invoicing API (PRAL Technical Specification v1.12) —
// this is purely a missing-credential guard, never a faked success. See docs/FBR-INTEGRATION.md
// for how to obtain a sandbox token from IRIS and set it in .env.
export class FbrNotConfiguredError extends FbrError {
  constructor() {
    super(
      "FBR is not configured: FBR_API_TOKEN is not set. Obtain a sandbox security token from " +
        "the IRIS portal (iris.fbr.gov.pk) and set it in the backend .env file — see docs/FBR-INTEGRATION.md.",
      "FBR_NOT_CONFIGURED",
      false,
    );
  }
}

export class FbrTimeoutError extends FbrError {
  constructor() {
    super("FBR API request timed out", "FBR_TIMEOUT", true);
  }
}

export class FbrRejectedError extends FbrError {
  constructor(message: string, httpStatus?: number) {
    super(message, "FBR_REJECTED", false, httpStatus);
  }
}
