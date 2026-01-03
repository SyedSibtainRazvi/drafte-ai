export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

type WebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{
      id: string;
      email_address: string;
    }>;
    primary_email_address_id?: string;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
  };
};

export async function POST(request: NextRequest) {
  try {
    // Allow test requests without webhook headers for debugging
    const isTestRequest = request.headers.get("x-test-webhook") === "true";

    if (isTestRequest) {
      if (!process.env.DATABASE_URL) {
        console.error("Webhook error: DATABASE_URL not configured");
        return NextResponse.json(
          { error: "Database not configured" },
          { status: 500 },
        );
      }

      try {
        const { prisma } = await import("@/lib/prisma");
        await prisma.$connect();
        return NextResponse.json({
          success: true,
          message: "Database connected successfully",
        });
      } catch (error) {
        console.error("Webhook error: Database connection failed", error);
        return NextResponse.json(
          { error: "Database connection failed" },
          { status: 500 },
        );
      }
    }
    // Import Prisma
    const { prisma } = await import("@/lib/prisma");

    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: "Missing webhook headers" },
        { status: 400 },
      );
    }

    const payload = await request.json();
    const body = JSON.stringify(payload);

    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Webhook error: CLERK_WEBHOOK_SECRET not set");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    const wh = new Webhook(webhookSecret);
    const evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;

    const eventType = evt.type;

    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;

      const primaryEmail = email_addresses?.find(
        (email) => email.id === evt.data.primary_email_address_id,
      )?.email_address;

      if (!primaryEmail) {
        return NextResponse.json(
          { error: "No primary email found" },
          { status: 400 },
        );
      }

      try {
        await prisma.user.upsert({
          where: { clerkId: id },
          update: {
            email: primaryEmail,
            firstName: first_name,
            lastName: last_name,
            imageUrl: image_url,
            updatedAt: new Date(),
          },
          create: {
            clerkId: id,
            email: primaryEmail,
            firstName: first_name || null,
            lastName: last_name || null,
            imageUrl: image_url || null,
            updatedAt: new Date(),
          },
        });
      } catch (syncError) {
        console.error("Webhook error: Failed to sync user", syncError);
        return NextResponse.json(
          { error: "Error syncing user" },
          { status: 500 },
        );
      }
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data;

      try {
        await prisma.user.delete({
          where: { clerkId: id },
        });
      } catch (deleteError) {
        console.error("Webhook error: Failed to delete user", deleteError);
        return NextResponse.json(
          { error: "Error deleting user" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
