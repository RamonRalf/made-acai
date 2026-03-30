// --- 1. CONFIGURAÇÕES GERAIS ---
let cart = [];
const TAXA_ENTREGA = 4.00;

// --- 2. GESTÃO DA SACOLA (CARRINHO) ---

function addItemToCart() {
    const sizeSelect = document.getElementById('size');
    if (sizeSelect.value === "0") { 
        alert("⚠️ Por favor, selecione o tamanho do açaí!"); 
        return; 
    }

    let toppings = [];
    let toppingsPrice = 0;

    // Captura apenas os adicionais marcados e disponíveis
    document.querySelectorAll('.topping:checked:not(:disabled)').forEach(item => {
        toppings.push(item.value);
        toppingsPrice += parseFloat(item.getAttribute('data-price'));
    });

    const itemPrice = parseFloat(sizeSelect.value) + toppingsPrice;
    const itemName = sizeSelect.options[sizeSelect.selectedIndex].text;

    // MONITORAMENTO: Adição ao carrinho
    if (typeof gtag === 'function') {
        gtag('event', 'add_to_cart', {
            'item_name': itemName,
            'value': itemPrice,
            'currency': 'BRL'
        });
    }

    cart.push({
        name: itemName,
        toppings: toppings,
        obs: document.getElementById('obs').value,
        price: itemPrice
    });

    updateCartUI();
    
    // Limpa campos após adicionar
    sizeSelect.value = "0";
    document.getElementById('obs').value = "";
    document.querySelectorAll('.topping').forEach(cb => cb.checked = false);
}

function removeItem(index) {
    const itemRemovido = cart[index];

    // MONITORAMENTO: Remoção (Análise de desistência)
    if (itemRemovido && typeof gtag === 'function') {
        gtag('event', 'remove_from_cart', {
            'item_name': itemRemovido.name,
            'value': itemRemovido.price
        });
    }

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

// --- 3. INTERFACE E PAGAMENTO ---

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

// --- 4. ENVIO E MONITORAMENTO DE RECORRÊNCIA ---

function sendOrder() {
    const name = document.getElementById('name').value;
    const payment = document.getElementById('payment').value;
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;

    if (cart.length === 0) { alert("Sua sacola está vazia!"); return; }
    if (!name || !payment) { alert("Preencha seu nome e a forma de pagamento!"); return; }

    // Lógica de Recorrência (Identifica se já pediu neste navegador antes)
    const jaPediuAntes = localStorage.getItem('made_acai_recorrente');
    const statusCliente = jaPediuAntes ? 'Recorrente' : 'Novo';

    const totalFinalStr = document.getElementById('totalValue').innerText;
    const valorNumerico = parseFloat(totalFinalStr.replace(',', '.'));

    // MONITORAMENTO: Conversão de Venda e Tipo de Cliente
    if (typeof gtag === 'function') {
        gtag('event', 'purchase', {
            'transaction_id': 'T_' + new Date().getTime(),
            'value': valorNumerico,
            'currency': 'BRL',
            'customer_type': statusCliente,
            'payment_type': payment,
            'items': cart.map(item => ({ 'item_name': item.name, 'price': item.price }))
        });
    }

    // Salva no navegador que o cliente já fez um pedido
    localStorage.setItem('made_acai_recorrente', 'true');

    let addressMsg = "";
    if (deliveryType === 'entrega') {
        const street = document.getElementById('street').value;
        const number = document.getElementById('number').value;
        const neighborhood = document.getElementById('neighborhood').value;
        const refPoint = document.getElementById('refPoint').value;

        if (!street || !number || !neighborhood || !refPoint) {
            alert("⚠️ Por favor, preencha o endereço completo para entrega!");
            return;
        }
        addressMsg = `📍 *ENTREGA:* ${street}, nº ${number}\n🏘️ *BAIRRO:* ${neighborhood}\n🗺️ *REF:* ${refPoint}`;
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
        `👤 *CLIENTE:* ${name}\n` +
        `🔄 *TIPO:* ${statusCliente === 'Recorrente' ? 'Cliente Antigo' : 'Primeiro Pedido'}\n\n` +
        `📦 *PRODUTOS:*` + `\n${itemsMsg}` +
        `${addressMsg}\n\n` +
        `💳 *PAGAMENTO:* ${payDetail}\n\n` +
        `💰 *TOTAL GERAL: R$ ${totalFinalStr}*`;

    // Abre o WhatsApp com o número do Rodrigo
    window.open(`https://wa.me/553299995869?text=${encodeURIComponent(message)}`, '_blank');
}
window.addEventListener("load", function() {
    const loader = document.getElementById("loader-container");
    
    // Espera 2 segundos (tempo dos 3 pulos) e esconde o loader
    setTimeout(() => {
        loader.classList.add("loader-hidden");
    }, 2000); 
});
