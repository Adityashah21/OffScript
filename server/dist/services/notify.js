import { env } from "../config/env.js";
export async function sendEmail(to, subject, bodyText) {
    if (!env.NOTIFY_EMAIL) {
        // Gracefully skip when NOTIFY_EMAIL is not configured
        return false;
    }
    try {
        // If RESEND_API_KEY is configured
        if (env.RESEND_API_KEY) {
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${env.RESEND_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: env.SMTP_FROM || "OFFSCRIPT Notifications <onboarding@resend.dev>",
                    to: [to],
                    subject,
                    text: bodyText,
                }),
            });
            return res.ok;
        }
        // If SMTP or other service is configured in the future, handle here
        console.log(`[NOTIFY SIMULATED] To: ${to} | Subject: ${subject}\n${bodyText}`);
        return true;
    }
    catch (error) {
        console.error("Failed to send notification email:", error);
        return false;
    }
}
export async function notifyNewOrder(order) {
    if (!env.NOTIFY_EMAIL)
        return;
    const subject = `[OFFSCRIPT] New COD Order Request: ${order.ref}`;
    const text = `
New Cash on Delivery order request received!

Ref: ${order.ref}
Date: ${order.createdAt.toISOString()}

Product: ${order.product.name} (Slug: ${order.product.slug})
Size: ${order.size || "N/A"}
Color: ${order.color}
Quantity: ${order.quantity}

Totals:
- Item Total: ₹${order.itemTotal}
- Shipping: ₹${order.shipping}
- Grand Total (COD): ₹${order.grandTotal}

Customer Details:
- Name: ${order.customer.fullName}
- Mobile: ${order.customer.mobile}
- Email: ${order.customer.email || "N/A"}

Delivery Address:
${order.customer.address.house}, ${order.customer.address.street}
${order.customer.address.landmark ? `Landmark: ${order.customer.address.landmark}\n` : ""}${order.customer.address.city}, ${order.customer.address.state} - ${order.customer.address.pin}

Instructions: ${order.instructions || "None"}
  `.trim();
    await sendEmail(env.NOTIFY_EMAIL, subject, text);
}
export async function notifyContactMessage(contact) {
    if (!env.NOTIFY_EMAIL)
        return;
    const subject = `[OFFSCRIPT] New Contact Message from ${contact.name}: ${contact.subject}`;
    const text = `
New Contact Message received:

From: ${contact.name} (${contact.email})
Subject: ${contact.subject}
Date: ${contact.createdAt.toISOString()}

Message:
${contact.message}
  `.trim();
    await sendEmail(env.NOTIFY_EMAIL, subject, text);
}
