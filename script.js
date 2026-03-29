let cart = [];
const TAXA_ENTREGA = 4.00;

// Gerencia a exibição das opções de pagamento (Pix/Dinheiro)
function handlePaymentChange() {
    const payment = document.getElementById('payment').value;
    document.getElementById('cash-options').style.display = (payment === 'Dinheiro') ? 'block' : 'none';
    document.getElementById('pix-options').style.display = (payment === 'Pix') ? 'block' : 'none';
}

// Gerencia a exibição do campo de troco
function toggleChangeInput() {
    const needChange = document.querySelector('input[name="needChange"]:checked').value;
    document.getElementById('change-input-div').style.display = (needChange === 'sim') ? 'block' : 'none';
}

// Copia a chave Pix para a área de transferência
function copyPixKey() {
    const key = document.getElementById('pix-key').innerText;
    navigator.clipboard.writeText(key).then(() => alert("Chave Pix copiada! ✅"));
}

// Gerencia a troca entre Entrega e Retirada
function handleDeliveryOption() {
    const type = document.querySelector('input[name="deliveryType"]:checked').value;
    document.getElementById('address-section').style.display = (type === 'entrega') ? 'block' : 'none';
    document.getElementById('pickup-info').style.display = (type === 'retirada') ? 'block' : 'none';
    updateCartUI(); // Atualiza o total para somar ou remover a taxa
}

// ADICIONA O ITEM À SACOLA (COM TRAVA PARA ITENS ESGOTADOS)
function addItemToCart() {
    const sizeSelect = document.getElementById('size');
    if (sizeSelect.value === "0") { 
        alert("⚠️ Por favor, selecione o tamanho do açaí!"); 
        return; 
    }

    let toppings = [];
    let toppingsPrice = 0;

    // ATUALIZAÇÃO IMPORTANTE: :not(:disabled) garante que itens esgotados sejam ignorados
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

    // Limpa os campos após adicionar
    updateCartUI();
    sizeSelect.value = "0";
    document.getElementById('obs').value = "";
    document.querySelectorAll('.topping').forEach(cb => cb.checked = false);
}

// Remove item da sacola
function removeItem(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// Atualiza a interface da sacola e os totais
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

// FORMATA E ENVIA O PEDIDO PARA O WHATSAPP
function sendOrder() {
    const name = document.getElementById('name').value;
    const payment = document.getElementById('payment').value;
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;

    if (cart.length === 0) { alert("Adicione pelo menos um item à sacola!"); return; }
    if (!name || !payment) { alert("Preencha seu nome e a forma de pagamento!"); return; }

    let addressMsg = "";

    // Coleta o endereço separado
    if (deliveryType === 'entrega') {
        const street = document.getElementById('street').value;
        const number = document.getElementById('number').value;
        const neighborhood = document.getElementById('neighborhood').value;
        const complement = document.getElementById('complement').value;
        const refPoint = document.getElementById('refPoint').value;

        if (!street || !number || !neighborhood || !refPoint) {
            alert("⚠️ Preencha todos os campos obrigatórios do endereço (Rua, Nº, Bairro e Referência)!");
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

    // Abre o WhatsApp do Rodrigo com a mensagem formatada
    window.open(`https://wa.me/5532998346183?text=${encodeURIComponent(message)}`, '_blank');
}
