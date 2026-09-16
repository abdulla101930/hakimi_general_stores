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
    const { amount, receipt } = req.body || {};
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TcalkhMpwuH5Lc';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'navXQ3Gzqloxf4CVCzAoyb2k';

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100), // In paise
        currency: 'INR',
        receipt: receipt || `hk_rcpt_${Date.now()}`
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Razorpay Order Creation Error:', data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json({
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId: keyId
    });
  } catch (error) {
    console.error('Server error creating Razorpay order:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
