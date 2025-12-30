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
    const { prisma } = await import("@/lib/prisma");
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: "Error occurred -- no svix headers" },
        { status: 400 },
      );
    }

    const payload = await request.json();
    const body = JSON.stringify(payload);

    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("CLERK_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "CLERK_WEBHOOK_SECRET is not set" },
        { status: 500 },
      );
    }

    const wh = new Webhook(webhookSecret);

    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return NextResponse.json(
        { error: "Error occurred -- verification failed" },
        { status: 400 },
      );
    }

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
      } catch (error) {
        console.error("Error syncing user:", error);
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
      } catch (error) {
        console.error("Error deleting user:", error);
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
