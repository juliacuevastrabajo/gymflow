import { useLocalSearchParams, useRouter } from "expo-router";

import GymFlowInvitationRegistration from "../src/components/auth/GymFlowInvitationRegistration";
import { publishAuthenticatedSession } from "../src/services/authSessionCoordinator";

export default function InvitationRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const initialToken = Array.isArray(params.token) ? params.token[0] : params.token;

  return (
    <GymFlowInvitationRegistration
      initialToken={initialToken || null}
      onBack={() => router.back()}
      onRegistered={(session) => {
        publishAuthenticatedSession(session);
        router.dismissAll();
      }}
    />
  );
}
