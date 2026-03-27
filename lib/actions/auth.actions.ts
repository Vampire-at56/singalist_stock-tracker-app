'use server';

import { headers } from 'next/headers';
import { getAuth } from '@/lib/better-auth/auth';
import { inngest } from '@/lib/inngest/client';

type ActionResult =
  | { success: true }
  | { success: false; error: string };

function toErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  return 'Unknown error';
}

export async function signUpWithEmail(data: SignUpFormData): Promise<ActionResult> {
  try {
    const h = await headers();
    const auth = await getAuth();

    await auth.api.signUpEmail({
      headers: h,
      body: {
        email: data.email,
        password: data.password,
        name: data.fullName,
        // better-auth allows extra keys; we keep profile data in Inngest.
      },
    });

    // Fire-and-forget welcome email workflow (handled by Inngest).
    try {
      await inngest.send({
        name: 'app/user.created',
        data: {
          email: data.email,
          name: data.fullName,
          country: data.country,
          investmentGoals: data.investmentGoals,
          riskTolerance: data.riskTolerance,
          preferredIndustry: data.preferredIndustry,
        },
      });
    } catch (e) {
      console.error('Failed to enqueue Inngest welcome email event:', e);
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: toErrorMessage(e) };
  }
}

export async function signInWithEmail(data: SignInFormData): Promise<ActionResult> {
  try {
    const h = await headers();
    const auth = await getAuth();

    await auth.api.signInEmail({
      headers: h,
      body: {
        email: data.email,
        password: data.password,
      },
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: toErrorMessage(e) };
  }
}

export async function signOut(): Promise<ActionResult> {
  try {
    const h = await headers();
    const auth = await getAuth();
    await auth.api.signOut({ headers: h });
    return { success: true };
  } catch (e) {
    return { success: false, error: toErrorMessage(e) };
  }
}
