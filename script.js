'use strict';

const CONFIG = Object.freeze({
  deliveryFee: 4,
  whatsapp: '5532999995869',
  storageKey: 'made_acai_cart_v2',
  sizes: [
    { id: '250ml', label: '250 ml', price: 6 },
    { id: '500ml', label: '500 ml', price: 12 },
    { id: '1000ml', label: '1000 ml', price: 24 }
  ],
  toppings: [
    { name: 'Biscoito Negresco', price: 2 }, { name: 'Granulado Preto', price: 2 },
    { name: 'Canudinho Recheado', price: 2 }, { name: 'Aveia', price: 2 },
    { name: 'Banana', price: 2.5 }, { name: 'Biscoito Oreo', price: 2.5 },
    { name: 'Farinha Láctea', price: 2.5 }, { name: 'Raspas de Chocolate', price: 2.5 },
    { name: 'Granola', price: 2.5 }, { name: 'Leite Condensado', price: 3.5 },
    { name: 'Leite em Pó', price: 3.5 }, { name: "Disquete/MM's", price: 3.5 },
    { name: 'Ovomaltine', price: 3.5 }, { name: 'Paçoca Original', price: 3.5 },
    { name: 'Morango', price: 4 }, { name: 'Creme de Paçoca', price: 4 },
    { name: 'Creme de Ovomaltine', price: 4 }, { name: 'Creme de Ninho', price: 4 },
    { name: 'Creme de Maracujá', price: 4 }, { name: 'Nutella Original', price: 8 },
    { name: 'Whey Protein', price: 8 }
  ]
});

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const money = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
let cart = loadCart();

function loadCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(CONFIG.storageKey));
    if (!Array.isArray(stored)) return [];
    return stored.filter(item => item && typeof item.name === 'string' && Number.isFinite(item.price));
  } catch { return []; }
}

function saveCart() {
  try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(cart)); } catch { /* Pedido continua sem persistência. */ }
}

function track(eventName, params = {}) {
  if (typeof window.gtag === 'function') window.gtag('event', eventName, params);
}

function gaItems() {
  return cart.map((item, index) => ({ item_id: item.sizeId, item_name: item.name, item_category: 'Açaí', price: item.price, quantity: 1, index }));
}

function renderOptions() {
  const sizes = $('#size-options');
  CONFIG.sizes.forEach(size => {
    const label = document.createElement('label'); label.className = 'choice-card';
    const input = document.createElement('input'); input.type = 'radio'; input.name = 'size'; input.value = size.id; input.dataset.price = size.price;
    const span = document.createElement('span');
    const strong = document.createElement('strong'); strong.textContent = size.label;
    const small = document.createElement('small'); small.textContent = money(size.price);
    span.append(strong, small); label.append(input, span); sizes.append(label);
  });

  const groups = new Map();
  CONFIG.toppings.forEach(topping => {
    if (!groups.has(topping.price)) groups.set(topping.price, []);
    groups.get(topping.price).push(topping);
  });
  groups.forEach((items, price) => {
    const section = document.createElement('section'); section.className = 'topping-group';
    const title = document.createElement('h3'); title.textContent = `${money(price)} cada`;
    const grid = document.createElement('div'); grid.className = 'topping-grid';
    items.forEach(topping => {
      const label = document.createElement('label'); label.className = 'topping-option';
      const input = document.createElement('input'); input.type = 'checkbox'; input.className = 'topping'; input.value = topping.name; input.dataset.price = topping.price;
      const text = document.createElement('span'); text.textContent = topping.name;
      label.append(input, text); grid.append(label);
    });
    section.append(title, grid); $('#topping-groups').append(section);
  });
}

function selectedSize() {
  const input = $('input[name="size"]:checked');
  return input ? CONFIG.sizes.find(size => size.id === input.value) : null;
}

function selectedToppings() {
  return $$('.topping:checked').map(input => ({ name: input.value, price: Number(input.dataset.price) }));
}

function updateItemSubtotal() {
  const size = selectedSize();
  const total = (size?.price || 0) + selectedToppings().reduce((sum, item) => sum + item.price, 0);
  $('#item-subtotal-value').textContent = money(total);
}

function addItem() {
  const size = selectedSize();
  if (!size) {
    showError('size', 'Escolha um tamanho antes de adicionar.');
    $('#size-options input').focus(); return;
  }
  clearError('size');
  const toppings = selectedToppings();
  const price = size.price + toppings.reduce((sum, item) => sum + item.price, 0);
  const item = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, sizeId: size.id, name: `${size.label} - ${money(size.price)}`, toppings: toppings.map(t => t.name), obs: $('#obs').value.trim(), price };
  cart.push(item); saveCart(); renderCart();
  track('add_to_cart', { currency: 'BRL', value: price, items: [{ item_id: size.id, item_name: item.name, item_category: 'Açaí', price, quantity: 1 }], toppings_count: toppings.length });
  $$('input[name="size"], .topping').forEach(input => { input.checked = false; });
  $('#obs').value = ''; updateItemSubtotal();
  $('#add-status').textContent = `${size.label} adicionado à sacola.`;
  setTimeout(() => { $('#add-status').textContent = ''; }, 3000);
}

function appendText(parent, tag, text, className) {
  const node = document.createElement(tag); node.textContent = text;
  if (className) node.className = className; parent.append(node); return node;
}

function renderCart() {
  const list = $('#cart-list'); list.replaceChildren();
  $('#cart-empty').hidden = cart.length > 0;
  $('#cart-count').textContent = cart.length ? `${cart.length} ${cart.length === 1 ? 'item adicionado' : 'itens adicionados'}.` : 'Nenhum item adicionado.';
  cart.forEach((item, index) => {
    const li = document.createElement('li'); li.className = 'cart-item';
    const info = document.createElement('div'); appendText(info, 'h3', `${index + 1}. ${item.name}`);
    appendText(info, 'p', item.toppings.length ? item.toppings.join(', ') : 'Sem adicionais');
    if (item.obs) appendText(info, 'p', `Observação: ${item.obs}`);
    appendText(info, 'strong', money(item.price));
    const button = document.createElement('button'); button.type = 'button'; button.className = 'remove-button'; button.textContent = 'Remover'; button.setAttribute('aria-label', `Remover ${item.name}`);
    button.addEventListener('click', () => removeItem(index)); li.append(info, button); list.append(li);
  });
  updateTotals();
}

function removeItem(index) {
  const [removed] = cart.splice(index, 1); saveCart(); renderCart();
  if (removed) track('remove_from_cart', { currency: 'BRL', value: removed.price, items: [{ item_id: removed.sizeId, item_name: removed.name, price: removed.price, quantity: 1 }] });
}

function deliveryType() { return $('input[name="deliveryType"]:checked').value; }
function productsTotal() { return cart.reduce((sum, item) => sum + item.price, 0); }
function orderTotal() { return productsTotal() + (cart.length && deliveryType() === 'entrega' ? CONFIG.deliveryFee : 0); }

function updateTotals() {
  const delivery = deliveryType() === 'entrega' ? CONFIG.deliveryFee : 0;
  $('#products-total').textContent = money(productsTotal()); $('#delivery-total').textContent = delivery ? money(delivery) : 'Grátis'; $('#totalValue').textContent = money(orderTotal());
}

function updateDelivery() {
  const pickup = deliveryType() === 'retirada'; $('#address-section').hidden = pickup; $('#pickup-info').hidden = !pickup; updateTotals();
}

function updatePayment() {
  const payment = $('#payment').value; $('#pix-options').hidden = payment !== 'Pix'; $('#cash-options').hidden = payment !== 'Dinheiro'; updateChange();
}

function updateChange() {
  const choice = $('input[name="needChange"]:checked'); $('#change-input-wrap').hidden = !choice || choice.value !== 'sim';
}

function showError(field, message) {
  const input = $(`#${field}`); if (input) input.setAttribute('aria-invalid', 'true'); $(`#${field}-error`).textContent = message;
}
function clearError(field) {
  const input = $(`#${field}`); if (input) input.removeAttribute('aria-invalid'); const error = $(`#${field}-error`); if (error) error.textContent = '';
}

function parseCurrency(value) { return Number(value.replace(/[^\d,.-]/g, '').replace(',', '.')); }

function validateOrder() {
  ['name', 'payment', 'address', 'change'].forEach(clearError); $('#form-error').textContent = '';
  if (!cart.length) { $('#form-error').textContent = 'Adicione pelo menos um açaí à sacola.'; $('#cart-title').scrollIntoView({ behavior: 'smooth' }); return false; }
  if (!$('#name').value.trim()) { showError('name', 'Informe seu nome.'); $('#name').focus(); return false; }
  if (deliveryType() === 'entrega' && (!$('#street').value.trim() || !$('#number').value.trim() || !$('#neighborhood').value.trim())) {
    $('#address-error').textContent = 'Preencha rua, número e bairro para a entrega.';
    const firstEmpty = ['street', 'number', 'neighborhood'].map(id => $(`#${id}`)).find(input => !input.value.trim()); firstEmpty.focus(); return false;
  }
  if (!$('#payment').value) { showError('payment', 'Escolha uma forma de pagamento.'); $('#payment').focus(); return false; }
  if ($('#payment').value === 'Dinheiro' && $('input[name="needChange"]:checked').value === 'sim') {
    const change = parseCurrency($('#changeValue').value);
    if (!Number.isFinite(change) || change <= orderTotal()) { showError('change', `Informe um valor maior que ${money(orderTotal())}.`); $('#changeValue').focus(); return false; }
  }
  return true;
}

function buildMessage() {
  const lines = ['*🍧 NOVO PEDIDO - MADÊ AÇAÍ*', '', `👤 *CLIENTE:* ${$('#name').value.trim()}`, '', '📦 *PRODUTOS:*'];
  cart.forEach((item, index) => { lines.push(`*${index + 1}. Açaí ${item.name}*`, `+ Extras: ${item.toppings.join(', ') || 'Nenhum'}`); if (item.obs) lines.push(`Obs: ${item.obs}`); lines.push(''); });
  if (deliveryType() === 'entrega') {
    lines.push(`📍 *ENTREGA:* ${$('#street').value.trim()}, nº ${$('#number').value.trim()}`, `🏘️ *BAIRRO:* ${$('#neighborhood').value.trim()}`);
    if ($('#complement').value.trim()) lines.push(`🏠 *COMPLEMENTO:* ${$('#complement').value.trim()}`);
    if ($('#refPoint').value.trim()) lines.push(`🗺️ *REFERÊNCIA:* ${$('#refPoint').value.trim()}`);
  } else lines.push('🏠 *RETIRADA NO LOCAL*');
  let payment = $('#payment').value;
  if (payment === 'Dinheiro') payment += $('input[name="needChange"]:checked').value === 'sim' ? ` (troco para ${money(parseCurrency($('#changeValue').value))})` : ' (sem troco)';
  lines.push('', `💳 *PAGAMENTO:* ${payment}`, '', `💰 *TOTAL: ${money(orderTotal())}*`); return lines.join('\n');
}

function submitOrder(event) {
  event.preventDefault(); if (!validateOrder()) return;
  const total = orderTotal();
  track('begin_checkout', { currency: 'BRL', value: total, items: gaItems() });
  track('whatsapp_checkout', { currency: 'BRL', value: total, delivery_type: deliveryType(), payment_type: $('#payment').value, items: gaItems() });
  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(buildMessage())}`, '_blank', 'noopener,noreferrer');
}

async function copyPix() {
  try { await navigator.clipboard.writeText($('#pix-key').textContent); $('#copy-status').textContent = 'Chave Pix copiada.'; }
  catch { $('#copy-status').textContent = 'Não foi possível copiar. Selecione a chave acima.'; }
}

function bindEvents() {
  $('#orderForm').addEventListener('change', event => {
    if (event.target.matches('input[name="size"], .topping')) updateItemSubtotal();
    if (event.target.name === 'deliveryType') updateDelivery();
    if (event.target.id === 'payment') updatePayment();
    if (event.target.name === 'needChange') updateChange();
  });
  $('#add-item').addEventListener('click', addItem); $('#copy-pix').addEventListener('click', copyPix); $('#orderForm').addEventListener('submit', submitOrder);
  $('#name').addEventListener('input', () => clearError('name')); $('#payment').addEventListener('change', () => clearError('payment'));
}

renderOptions(); bindEvents(); updateDelivery(); updatePayment(); updateItemSubtotal(); renderCart();

const loaderStartedAt = performance.now();
function hidePageLoader() {
  const remaining = Math.max(0, 650 - (performance.now() - loaderStartedAt));
  setTimeout(() => {
    const loader = $('#page-loader');
    loader.classList.add('is-hidden'); loader.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-loading');
  }, remaining);
}
if (document.readyState === 'complete') hidePageLoader();
else window.addEventListener('load', hidePageLoader, { once: true });
