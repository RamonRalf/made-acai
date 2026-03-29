let cart = [];
const TAXA_ENTREGA = 4.00;

// 1. STATUS DA LOJA
function checkStoreStatus() {
    const statusElement = document.getElementById('status-bar');
    const btnSend = document.getElementById('btn-finalizar');
    
    const now = new Date();
    const day = now.getDay(); 
    const hour = now.getHours();
    
    // Aberto de Terça a Domingo (dia !== 1), das 14h às 22h
    const isOpenDay = (day !== 1); 
    const isOpenHour = (hour >= 14 && hour < 22);

    if (isOpenDay && isOpenHour) {
        statusElement.innerText = "🟢 ABERTO AGORA - PEÇA JÁ!";
        statusElement.className = "status-bar status-open";
        btnSend.disabled = false;
        btnSend.style.opacity = "1";
    } else {
        statusElement.innerText = "🔴 FECHADO NO MOMENTO";
        statusElement.className = "status-bar status-closed";
        btnSend.disabled = true;
        btnSend.style.opacity = "0.5";
        btnSend.innerText = "Loja Fechada no Momento 😴";
    }
}

// 2. INTERFACE E PAGAMENTO
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

// 3. LOGICA DO CARRINHO
function addItemToCart() {
    const sizeSelect = document.getElementById('size');
    if (sizeSelect.value === "0") { alert("⚠️ Selecione o tamanho!"); return; }

    let toppings = [];
    let toppingsPrice = 0;

    // Filtra apenas itens marcados e NÃO desativados (esgotados)
    document.querySelectorAll('.topping:checked:not(:disabled)').forEach(item => {
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
    
    // Reseta campos
    sizeSelect.value = "0";
    document.getElementById('obs').value = "";
    document.querySelectorAll('.topping').forEach(cb => cb.checked = false);
}

function removeItem(index) {
    cart.splice(index, 1);
    updateCartUI();
}

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
                <small>+ ${item.toppings.join(', ') || 'Sem extras'}</small><br>
                ${item.obs ? `<small><i>Obs: ${item.obs}</i></small><br>` : ''}
                <span>R$ ${item.price.toFixed(2).replace('.', ',')}</span>
            </div>
            <button type="button" class="btn-remove" onclick="removeItem(${index})">Remover 🗑️</button>
        `;
        cartList.appendChild(li);
    });

    const isEntrega = document.querySelector('input[name="deliveryType"]:checked').value === 'entrega';
    const totalFinal = isEntrega ? totalProdutos + TAXA_ENTREGA : totalProdutos;
    totalDisplay.innerText = totalFinal.toFixed(2).replace('.', ',');
}

// 4. ENVIO WHATSAPP
function sendOrder() {
    const name = document.getElementById('name').value;
    const payment = document.getElementById('payment').value;
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;

    if (cart.length === 0) { alert("Adicione um item!"); return; }
    if (!name || !payment) { alert("Preencha nome e pagamento!"); return; }

    let addressFinal = "";
    if (deliveryType === 'entrega') {
        const street = document.getElementById('street').value;
        const num = document.getElementById('number').value;
        const neighborhood = document.getElementById('neighborhood').value;
        const comp = document.getElementById('complement').value;
        const ref = document.getElementById('refPoint').value;

        if (!street || !num || !neighborhood || !ref) {
            alert("⚠️ Preencha o endereço completo!"); return;
        }
        addressFinal = `📍 *ENTREGA:* ${street}, nº ${num}\n🏘️ *BAIRRO:* ${neighborhood}\n🏢 *COMP:* ${comp || '---'}\n🗺️ *REF:* ${ref}`;
    } else {
        addressFinal = `🏠 *RETIRADA NO LOCAL*`;
    }

    let itemsMsg = "";
    cart.forEach((item, i) => {
        itemsMsg += `*${i+1}º Açaí:* ${item.name}\n+ Extras: ${item.toppings.join(', ') || 'Nenhum'}\n${item.obs ? `Obs: ${item.obs}\n` : ''}\n`;
    });

    const totalStr = document.getElementById('totalValue').innerText;
    
    // Mensagem formatada com Template Strings
    const message = `*🍧 NOVO PEDIDO - MADÊ AÇAÍ*

👤 *CLIENTE:* ${name}

📦 *PRODUTOS:*
${itemsMsg}${addressFinal}

💳 *PAGAMENTO:* ${payment}
💰 *TOTAL GERAL: R$ ${totalStr}*`;

    window.open(`https://wa.me/5532998346183?text=${encodeURIComponent(message)}`, '_blank');
}

window.onload = checkStoreStatus;
