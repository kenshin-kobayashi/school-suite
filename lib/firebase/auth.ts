import {
  signInWithEmailAndPassword,
  signOut,
  type User,
  type UserCredential,
} from "firebase/auth";

import { auth } from "../firebase";

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<UserCredential> {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    throw new Error("メールアドレスを入力してください。");
  }

  if (!password) {
    throw new Error("パスワードを入力してください。");
  }

  return signInWithEmailAndPassword(
    auth,
    normalizedEmail,
    password,
  );
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export function getCurrentFirebaseUser(): User | null {
  return auth.currentUser;
}