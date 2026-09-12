import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const AUTH_TOKEN_KEY = "gymflow.auth.token";
let webMemoryToken: string | null = null;

export async function obtenerTokenSesion(): Promise<string | null> {
  if (Platform.OS === "web") {
    return webMemoryToken;
  }

  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function guardarTokenSesion(token: string): Promise<void> {
  if (Platform.OS === "web") {
    webMemoryToken = token;
    return;
  }

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function eliminarTokenSesion(): Promise<void> {
  if (Platform.OS === "web") {
    webMemoryToken = null;
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}
