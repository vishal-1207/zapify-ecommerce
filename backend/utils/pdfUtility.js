import puppeteer from "puppeteer";
import { renderTemplate } from "./mailUtility.js";

/**
 * Generates an Invoice PDF buffer from an order object.
 * @param {object} order - The order object with all necessary associations.
 * @returns {Promise<Buffer>} The PDF buffer.
 */
export const generateInvoicePDF = async (order) => {
  try {
    const html = await renderTemplate("invoice", {
      orderId: order.uniqueOrderId || order.id,
      date: order.createdAt,
      customerName: order.user?.fullname || "Customer",
      customerEmail: order.user?.email || "",
      address: order.shippingAddress,
      items: (order.orderItems || []).map((item) => ({
        productName: item.Offer.product.name,
        sellerStore: item.Offer.sellerProfile.storeName,
        quantity: item.quantity,
        priceAtTimeOfPurchase: item.priceAtTimeOfPurchase,
        itemTotal: item.priceAtTimeOfPurchase * item.quantity,
      })),
      subtotal: Number(order.subtotalAmount) - Number(order.taxAmount),
      taxAmount: order.taxAmount,
      taxRate: order.taxRate || 18,
      discount: order.discountAmount,
      total: order.totalAmount,
    });

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px",
      },
    });

    await browser.close();
    return pdf;
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    throw error;
  }
};
