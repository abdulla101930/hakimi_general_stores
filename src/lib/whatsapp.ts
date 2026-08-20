import type { Order } from '../types';
import { OWNER_WHATSAPP, OWNER_PHONE_DISPLAY } from './constants';

export const buildOrderWhatsAppText = (order: Order): string => {
  const itemsText = order.items
    .map((item) => `• *${item.name} (${item.weight})*  x${item.quantity}  -  ₹${item.price * item.quantity}`)
    .join('\n');

  const deliveryText = order.bill.deliveryCharge === 0 ? '₹0 (FREE Delivery! 🎉)' : `₹${order.bill.deliveryCharge}`;
  const discountText = order.bill.discount > 0 ? `-₹${order.bill.discount}` : '₹0';
  const instructionsText = order.instructions ? `\n🔔 *DELIVERY INSTRUCTION:*\n"${order.instructions}"` : '';
  const gpsLinkText = order.address.gps
    ? `\n🗺️ *GPS Location Pin:* https://www.google.com/maps/search/?api=1&query=${order.address.gps.lat},${order.address.gps.lng}`
    : '';

  return `🛒 *NEW ORDER - HAKIMI SUPER MARKET (${OWNER_PHONE_DISPLAY})*
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
};

export const sendOrderToWhatsApp = (order: Order): string => {
  const encodedText = encodeURIComponent(buildOrderWhatsAppText(order));
  return `https://wa.me/${OWNER_WHATSAPP}?text=${encodedText}`;
};

export const buildCheckoutWhatsAppText = (
  order: Order,
  opts: { instruction: string; paymentDetails?: string }
): string => {
  const { instruction, paymentDetails } = opts;
  let msg = `🛒 *NEW ORDER - HAKIMI GENERAL STORE*\n`;
  msg += `------------------------------------\n`;
  msg += `👤 *Customer:* ${order.customerName} (${order.customerPhone})\n`;
  msg += `📍 *Delivery Address:* ${order.address.type} - ${order.address.details}\n`;
  msg += `📋 *Instruction:* ${instruction}\n`;
  msg += `💳 *Payment Method:* ${order.paymentMethod === 'ONLINE' ? '🟢 ONLINE PAYMENT' : '💵 CASH ON DELIVERY (COD)'}\n`;
  msg += `📊 *Payment Status:* ${order.paymentStatus} ${paymentDetails ? `(${paymentDetails})` : ''}\n\n`;
  msg += `📦 *ORDER ITEMS:*\n`;

  order.items.forEach((item, index) => {
    msg += `${index + 1}. ${item.name} (${item.weight}) x ${item.quantity} = ₹${item.price * item.quantity}\n`;
  });

  msg += `\n------------------------------------\n`;
  msg += `💵 *Item Total:* ₹${order.bill.itemsTotal}\n`;
  if (order.bill.discount > 0) msg += `🎟️ *Discount:* -₹${order.bill.discount}\n`;
  msg += `🚚 *Delivery Fee:* ${order.bill.deliveryCharge === 0 ? 'FREE' : `₹${order.bill.deliveryCharge}`}\n`;
  msg += `💰 *TOTAL PAYABLE:* ₹${order.bill.grandTotal}\n`;
  msg += `------------------------------------\n`;
  msg += `Please confirm and dispatch my order! Thank you.`;
  return msg;
};

export const sendCheckoutOrderToWhatsApp = (
  order: Order,
  opts: { instruction: string; paymentDetails?: string }
): string => {
  const encodedMsg = encodeURIComponent(buildCheckoutWhatsAppText(order, opts));
  return `https://api.whatsapp.com/send?phone=${OWNER_WHATSAPP}&text=${encodedMsg}`;
};


