// --- 1. CONFIGURAÇÕES GERAIS ---
let cart = [];
const TAXA_ENTREGA = 4.00;

// Configuração de Funcionamento (Horário de Brasília)
// Aberto de Terça (2) a Domingo (0), das 14:00 às 22:00. Segunda (1) fechado.
const DIAS_FECHADOS = [1]; 
const HORA_ABERTURA = 14;
const HORA_FECHAMENTO = 22;

// --- 2. LÓGICA DE HORÁRIO (Sincronizada com Brasília) ---
function getBrazilTime() {
    const targetTimeZone = "America/Sao_Paulo";
    const spTimeStr = new Date().toLocaleString("en-US", { timeZone: targetTimeZone });
    return new Date(spTimeStr);
}

function checkStoreStatus() {
    const statusElement = document.getElementById('status-bar');
    const btnSend = document.querySelector('.btn-send');
    if (!statusElement || !btnSend) return;

    const now = getBrazilTime();
    const day = now.getDay(); 
    const hour = now.getHours();

    const isOpenDay = !DIAS_FECHADOS.includes(day);
    const isOpenHour = (hour >= HORA_ABERTURA && hour < HORA_FECHAMENTO);

    if (isOpenDay && isOpenHour) {
        statusElement.innerText = "🟢 ABERTO AGORA - PEÇA JÁ!";
        statusElement.className = "status-bar status-open";
        btnSend.disabled = false;
        btnSend.style.opacity = "1";
        btnSend.innerText = "Finalizar Pedido no WhatsApp 🛵";
    } else {
        statusElement.innerText = "🔴 FECHADO NO MOMENTO";
        statusElement.className = "status-bar status-closed";
        btnSend.disabled = true;
        btnSend.style.opacity = "0.5";
        btnSend.innerText = "Loja Fechada - Volte Amanhã 😴";
    }
}

// --- 3. GESTÃO DA SACOLA (CARRINHO) ---

function addItemToCart() {
    const sizeSelect = document.getElementById('size');
    if (sizeSelect.value === "0") { 
        alert("⚠️ Por favor, selecione o tamanho do açaí!"); 
        return; 
    }

    let toppings = [];
    let toppingsPrice = 0;

    // Pega apenas os adicionais marcados que NÃO estão desativados (esgotados)
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
    
    // Limpa os campos para o próximo item
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

    const isEntrega = document.querySelector('input[name="deliveryType"]:checked').value === 'entrega';
    const totalFinal = isEntrega ? totalProdutos + TAXA_ENTREGA : totalProdutos;
    totalDisplay.innerText = totalFinal.toFixed(2).replace('.', ',');
}

// --- 4. FORMULÁRIO E PAGAMENTO ---

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

// --- 5. ENVIO DO PEDIDO ---

function sendOrder() {
    const name = document.getElementById('name').value;
    const payment = document.getElementById('payment').value;
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;

    if (cart.length === 0) { alert("Sua sacola está vazia!"); return; }
    if (!name || !payment) { alert("Preencha seu nome e a forma de pagamento!"); return; }

    let addressMsg = "";

    if (deliveryType === 'entrega') {
        const street = document.getElementById('street').value;
        const number = document.getElementById('number').value;
        const neighborhood = document.getElementById('neighborhood').value;
        const complement = document.getElementById('complement').value;
        const refPoint = document.getElementById('refPoint').value;

        if (!street || !number || !neighborhood || !refPoint) {
            alert("⚠️ Por favor, preencha todos os campos do endereço (Rua, Nº, Bairro e Referência)!");
            return;
        }

        addressMsg = `📍 *ENTREGA:* ${street}, nº ${number}\n🏘️ *BAIRRO:* ${neighborhood}\n🏢 *COMP:* ${complement || 'Não informado'}\n🗺️ *REF:* ${refPoint}`;
    } else {
        addressMsg = `🏠 *RETIRADA NO LOCAL*`;
    }

    let itemsMsg = "";
    cart.forEach((item, i) => {
        itemsMsg += `*${i+1}º Açaí:* ${item.name}\n+ Extras: ${item.toppings.join(', ') || 'Nenhum'}\n${item.obs ? `Obs: ${item.obs}\n` : ''}\n`;
    });

    let payDetail = payment;
    if (payment === 'Dinheiro') {
        const needChange = document.querySelector('input[name="needChange"]:checked').value;
        payDetail += needChange === 'sim' ? ` (Troco para R$ ${document.getElementById('changeValue').value})` : ` (Sem troco)`;
    }

    const message = 
        `*🍧 NOVO PEDIDO - MADÊ AÇAÍ*` + `\n\n` +
        `👤 *CLIENTE:* ${name}\n\n` +
        `📦 *PRODUTOS:*` + `\n${itemsMsg}` +
        `${addressMsg}\n\n` +
        `💳 *PAGAMENTO:* ${payDetail}\n\n` +
        `💰 *TOTAL GERAL: R$ ${document.getElementById('totalValue').innerText}*`;

    window.open(`https://wa.me/5532998346183?text=${encodeURIComponent(message)}`, '_blank');
}

// Inicia a verificação de status ao carregar
window.onload = checkStoreStatus;
