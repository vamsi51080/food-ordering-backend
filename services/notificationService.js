const nodemailer = require('nodemailer');

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
const parseEmailList = (value = '') =>
  String(value)
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

const getSmtpTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

const buildItemsHtml = (items = []) =>
  items
    .map((item) => {
      const options =
        item.selectedOptions && item.selectedOptions.length
          ? `<br/><small>Options: ${item.selectedOptions
              .map((opt) => opt.choiceLabel || opt.label || opt.choiceId || 'Option')
              .join(', ')}</small>`
          : '';

      return `<li><strong>${item.quantity}x ${item.itemName}</strong> (${formatCurrency(
        item.itemTotal
      )} each)${options}</li>`;
    })
    .join('');

const buildOrderPlacedHtml = (order) => {
  const notes = order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : '';
  return `
    <h2>New Order Received: ${order.orderNumber}</h2>
    <p><strong>Customer:</strong> ${order.customerName}</p>
    <p><strong>Phone:</strong> ${order.customerPhone}</p>
    <p><strong>Email:</strong> ${order.customerEmail || 'N/A'}</p>
    <p><strong>Pickup Time:</strong> ${order.pickupTime}</p>
    <p><strong>Subtotal:</strong> ${formatCurrency(order.subtotal)}</p>
    <p><strong>Tax:</strong> ${formatCurrency(order.tax)}</p>
    <p><strong>Total:</strong> ${formatCurrency(order.total)}</p>
    ${notes}
    <h3>Items</h3>
    <ul>${buildItemsHtml(order.items)}</ul>
  `;
};

const buildOrderReadyHtml = (order) => `
  <h2>Your Order Is Ready For Pickup</h2>
  <p>Hi ${order.customerName},</p>
  <p>Your order <strong>${order.orderNumber}</strong> is ready for pickup.</p>
  <p><strong>Pickup Time:</strong> ${order.pickupTime}</p>
  <p><strong>Total:</strong> ${formatCurrency(order.total)}</p>
  <p>Please come to the store counter and mention your order number.</p>
`;

const sendEmail = async ({ to, subject, html }) => {
  const transporter = getSmtpTransporter();
  const from = process.env.NOTIFICATION_EMAIL_FROM || process.env.SMTP_USER;
  const recipients = Array.isArray(to) ? to : [to];
  const validRecipients = recipients.filter(Boolean);

  if (!transporter || !from || validRecipients.length === 0) {
    return { sent: false, reason: 'SMTP settings missing' };
  }

  await transporter.sendMail({
    from,
    to: validRecipients.join(', '),
    subject,
    html,
  });

  return { sent: true };
};

exports.sendOrderPlacedEmailToAdmin = async (order) => {
  const adminEmailList = parseEmailList(process.env.NOTIFICATION_EMAIL_TO);
  return sendEmail({
    to: adminEmailList,
    subject: `New Order ${order.orderNumber} - ${order.customerName}`,
    html: buildOrderPlacedHtml(order),
  });
};

exports.sendOrderReadyEmailToCustomer = async (order) => {
  if (!order.customerEmail) {
    return { sent: false, reason: 'Customer email missing' };
  }

  return sendEmail({
    to: order.customerEmail,
    subject: `Your Order ${order.orderNumber} Is Ready`,
    html: buildOrderReadyHtml(order),
  });
};
