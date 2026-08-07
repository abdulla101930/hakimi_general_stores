import type { Order } from '../context/AppContext';

const OWNER_PHONE = '919657152532'; // Clean phone number for wa.me API (no + or spaces)

/**
 * Formats order information and generates a WhatsApp URL to message the owner.
 */
export const sendOrderToWhatsApp = (order: Order) => {
  const itemsText = order.items
    .map(item => `• *${item.name} (${item.weight})*  x${item.quantity}  -  ₹${item.price * item.quantity}`)
    .join('\n');

  const deliveryText = order.bill.deliveryCharge === 0 
    ? '₹0 (FREE Delivery! 🎉)' 
    : `₹${order.bill.deliveryCharge}`;

  const discountText = order.bill.discount > 0 
    ? `-₹${order.bill.discount}` 
    : '₹0';

  const instructionsText = order.instructions 
    ? `\n🔔 *DELIVERY INSTRUCTION:*\n"${order.instructions}"` 
    : '';

  const gpsLinkText = order.address.gps
    ? `\n🗺️ *GPS Location Pin:* https://www.google.com/maps/search/?api=1&query=${order.address.gps.lat},${order.address.gps.lng}`
    : '';

  const messageText = `🛒 *NEW ORDER - HAKIMI SUPER MARKET*
--------------------------------------------
🆔 *Order ID:* ${order.id}
👤 *Customer:* ${order.customerName}
📞 *Phone:* ${order.customerPhone}
📅 *Date:* ${order.date}

📦 *ITEMS ORDERED:*
${itemsText}

💵 *BILL DETAILS:*
• Items Total: ₹${order.bill.itemsTotal}
• Handling Fee: ₹${order.bill.handlingCharge}
• Delivery Charge: ${deliveryText}
• Discount Applied: ${discountText}
--------------------------------------------
💰 *GRAND TOTAL: ₹${order.bill.grandTotal}*
--------------------------------------------
📍 *DELIVERY ADDRESS:*
${order.address.details}${gpsLinkText}
${instructionsText}

Thank you for choosing *Hakimi Super Market*! 🌟
Please deliver the order soon.`;

  // Encode text for URL query string
  const encodedText = encodeURIComponent(messageText);
  
  // Return the direct WhatsApp web/app link
  return `https://wa.me/${OWNER_PHONE}?text=${encodedText}`;
};
