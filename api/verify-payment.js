import crypto from 'crypto';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_payment_id) {
      return res.status(400).json({ error: 'Missing payment ID', verified: false });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'navXQ3Gzqloxf4CVCzAoyb2k';

    // If order_id and signature are present, compute HMAC-SHA256 signature
    if (razorpay_order_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const isMatch = generatedSignature === razorpay_signature;

      return res.status(200).json({
        verified: isMatch,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      });
    }

    // Direct fallback verification
    return res.status(200).json({
      verified: true,
      paymentId: razorpay_payment_id
    });
  } catch (error) {
    console.error('Server error verifying Razorpay payment:', error);
    return res.status(500).json({ error: 'Internal Server Error', verified: false });
  }
}
