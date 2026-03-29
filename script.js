let cart = [];
const TAXA_ENTREGA = 4.00;

function handlePaymentChange() {
    const payment = document.getElementById('payment').value;
    document.getElementById('cash-options').style.display = (payment === 'Dinheiro') ? 'block' : 'none';
    document.getElementById('pix-options').style.display = (payment === 'Pix') ? 'block' : 'none';
}

function toggleChangeInput() {
    const needChange = document.querySelector('input[name="needChange"]:checked').value;
    document.getElementById('change-input-div').style.display = (needChange === 'sim') ? 'block' : 'none';
}

function copyPixKey() {
    const key = document.getElementById('pix-key').innerText;
    navigator.clipboard.writeText(key).then(() => alert("Chave Pix copiada! ✅"));
}

function handleDeliveryOption() {
    const type = document.querySelector('input[name="deliveryType"]:checked').value;
    document.getElementById('address-section').style.display = (type === 'entrega') ? 'block' : 'none';
    document.getElementById('pickup-info').style.display = (type === 'retirada') ? 'block' : 'none';
    updateCartUI();
}

function addItemToCart() {
    const sizeSelect = document.getElementById('size');
    if (sizeSelect.value === "0") { alert("⚠️ Selecione o tamanho!"); return; }

    let toppings = [];
    let toppingsPrice = 0;
    document.querySelectorAll('.topping:checked').forEach(item => {
        toppings.push(item.value);
        toppingsPrice += parseFloat(item.getAttribute('data-price'));
    });

    cart.push({
        name: sizeSelect.options[sizeSelect.selectedIndex].text,
        toppings: toppings,
        obs: document.getElementById('obs').value,
        price: parseFloat(sizeSelect.value) + toppingsPrice
    });

    updateCartUI();
    sizeSelect.value = "0";
    document.getElementById('obs').value = "";
    document.querySelectorAll('.topping').forEach(cb => cb.checked = false);
}

function removeItem(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// FUNÇÃO ATUALIZADA: BOTÃO REMOVER COM TEXTO E ÍCONE
function updateCartUI() {
    const cartList = document.getElementById('cart-list');
    const totalDisplay = document.getElementById('totalValue');
    cartList.innerHTML = "";
    let totalProdutos = 0;

    if (cart.length === 0) {
        cartList.innerHTML = '<li class="empty-msg">Sua sacola está vazia...</li>';
        totalDisplay.innerText = "0,00";
        return;
    }

    cart.forEach((item, index) => {
        totalProdutos += item.price;
        const li = document.createElement('li');
        li.className = "cart-item";
        li.innerHTML = `
            <div class="cart-item-info">
                <strong>${index + 1}. ${item.name}</strong><br>
                <small>+ ${item.toppings.join(', ') || 'Sem adicionais'}</small><br>
                ${item.obs ? `<small><i>Obs: ${item.obs}</i></small><br>` : ''}
                <span>R$ ${item.price.toFixed(2).replace('.', ',')}</span>
            </div>
            <button type="button" class="btn-remove" onclick="removeItem(${index})">
                Remover 🗑️
            </button>
        `;
        cartList.appendChild(li);
    });

    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;
    const totalFinal = (deliveryType === 'entrega') ? totalProdutos + TAXA_ENTREGA : totalProdutos;
    totalDisplay.innerText = totalFinal.toFixed(2).replace('.', ',');
}

function sendOrder() {
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;
    const payment = document.getElementById('payment').value;

    if (cart.length === 0) { alert("Adicione um açaí primeiro!"); return; }
    if (!name || !payment) { alert("Preencha seu nome e pagamento!"); return; }
    if (deliveryType === 'entrega' && address.length < 15) { alert("⚠️ Preencha o endereço completo!"); return; }

    let itemsMsg = "";
    cart.forEach((item, i) => {
        itemsMsg += `*${i+1}º Açaí:* ${item.name}\n+ Extras: ${item.toppings.join(', ') || 'Nenhum'}\n${item.obs ? `Obs: ${item.obs}\n` : ''}\n`;
    });

    let paymentDetail = payment;
    if (payment === 'Dinheiro') {
        const needChange = document.querySelector('input[name="needChange"]:checked').value;
        paymentDetail += needChange === 'sim' ? ` (Troco para R$ ${document.getElementById('changeValue').value})` : ` (Sem troco)`;
    }

    const message = 
        `*🍧 NOVO PEDIDO - MADÊ AÇAÍ*` + `\n\n` +
        `👤 *CLIENTE:* ${name}` + `\n\n` +
        `📦 *PRODUTOS:*` + `\n${itemsMsg}` +
        `${deliveryType === 'entrega' ? `📍 *ENTREGA:* ${address}` : `🏠 *RETIRADA NO LOCAL*`}` + `\n\n` +
        `💳 *PAGAMENTO:* ${paymentDetail}` + `\n\n` +
        `💰 *TOTAL GERAL: R$ ${document.getElementById('totalValue').innerText}*`;

    window.open(`https://wa.me/5532998346183?text=${encodeURIComponent(message)}`, '_blank');
}
