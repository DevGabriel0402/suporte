export function whatsappNumber(value) {
  const input = String(value ?? '').trim();
  if (!/^\+?[0-9 ().-]+$/.test(input)) return '';
  const digits = input.replace(/\D/g, '');
  return /^[1-9][0-9]{7,14}$/.test(digits) ? digits : '';
}

export function whatsappLink(value) {
  const number = whatsappNumber(value);
  return number ? 'https://wa.me/' + number : undefined;
}
