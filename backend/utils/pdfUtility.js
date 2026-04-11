import puppeteer from "puppeteer";
import { renderTemplate } from "./mailUtility.js";

/**
 * Generates an Invoice PDF buffer from an order object.
 * @param {object} order - The order object with all necessary associations.
 * @returns {Promise<Buffer>} The PDF buffer.
 */
/**
 * Helper to format address components from potentially different naming conventions.
 */
const formatAddress = (addr) => {
  if (!addr) return null;
  const street = addr.street || addr.addressLine1 || "";
  let details = addr.details || addr.addressLine2 || "";
  if (details && typeof details === "object") {
    details = Object.values(details).filter((v) => v).join(", ");
  }
  return {
    fullname: addr.fullname || "",
    phoneNumber: addr.phoneNumber || "",
    street,
    details,
    city: addr.city || "",
    state: addr.state || "",
    zipCode: addr.zipCode || addr.pincode || "",
    country: addr.country || "India",
  };
};

/**
 * Generates an Invoice PDF buffer from an order object.
 * @param {object} order - The order object with all necessary associations.
 * @returns {Promise<Buffer>} The PDF buffer.
 */
export const generateInvoicePDF = async (order) => {
  try {
    const totalMrp = Number(order.mrp) || 0;
    const finalDiscount = Number(order.discountAmount) || 0;

    const html = await renderTemplate(
      "invoice",
      {
        orderId: order.uniqueOrderId || order.id,
        date: order.createdAt,
        customerName: order.user?.fullname || "Customer",
        customerEmail: order.user?.email || "",
        address: formatAddress(order.shippingAddress),
        items: (order.orderItems || []).map((item) => {
          const mrp =
            Number(item.Offer?.product?.price) ||
            Number(item.priceAtTimeOfPurchase);
          const sellingPrice = Number(item.priceAtTimeOfPurchase);
          const discount = Math.max(0, mrp - sellingPrice);
          return {
            productName: item.Offer.product.name,
            sellerStore: item.Offer.sellerProfile.storeName,
            quantity: item.quantity,
            mrp,
            priceAtTimeOfPurchase: sellingPrice,
            discount,
            itemTotal: sellingPrice * item.quantity,
          };
        }),
        mrpTotal: totalMrp,
        subtotal: Number(order.subtotalAmount) - Number(order.taxAmount),
        taxAmount: order.taxAmount,
        taxRate: order.taxRate || 18,
        discount: finalDiscount,
        total: order.totalAmount,
      },
      null,
    );

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    
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
