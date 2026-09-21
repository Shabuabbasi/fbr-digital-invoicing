import { FbrSubmissionsList } from "./FbrSubmissionsList";

export function FbrLogs() {
  return (
    <FbrSubmissionsList
      title="FBR Integration Logs"
      description="Full request/response audit trail for FBR submissions"
      useLogsEndpoint
    />
  );
}
