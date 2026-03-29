let cart = [];

// 1. LÓGICA DE VISIBILIDADE (PAGAMENTO E TROCO)
// Exibe seção de troco apenas se a forma de pagamento for "Dinheiro"
function handlePaymentChange() {
    const payment = document.getElementById('payment').value;
    const cashOptions = document.getElementById('cash-options');
    
    if (payment === 'Dinheiro') {
        cashOptions.style.display = 'block';
    } else {
        cashOptions.style.display = 'none';
        // Limpa a escolha de troco caso mude de ideia
        document.getElementById('change-input-div').style.display = 'none';
    }
}

// Exibe o campo de "Troco para quanto?" apenas se o cliente marcar "Sim"
function toggleChangeInput() {
    const needChange = document.querySelector('input[name="needChange"]:checked').value;
    const changeInputDiv = document.getElementById('change-input-div');
    
    changeInputDiv.style.display = (needChange === 'sim') ? 'block' : 'none';
}


// 2. LÓGICA DA SACOLA (CARRINHO)
// Adiciona o açaí montado à lista de pedidos
function addItemToCart() {
    const sizeSelect = document.getElementById('size');
    const sizeValue = parseFloat(sizeSelect.value);
    
    if (sizeValue === 0 || isNaN(sizeValue)) {
        alert("Por favor, selecione um tamanho de açaí!");
        return;
    }

    const sizeText = sizeSelect.options[sizeSelect.selectedIndex].text;
    let toppings = [];
    let toppingsPrice = 0;

    // Captura todos os adicionais marcados
    document.querySelectorAll('.topping:checked').forEach(item => {
        toppings.push(item.value);
        toppingsPrice += parseFloat(item.getAttribute('data-price'));
    });

    const totalItem = sizeValue + toppingsPrice;

    // Adiciona o objeto do pedido ao array 'cart'
    cart.push({
        name: sizeText,
        toppings: toppings,
        price: totalItem
    });

    updateCartUI();
    resetSelections();
}

// Remove um item específico da sacola pelo índice
function removeItem(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// Atualiza a interface da sacola e o Total Geral
function updateCartUI() {
    const cartList = document.getElementById('cart-list');
    const totalDisplay = document.getElementById('totalValue');
    cartList.innerHTML = "";
    let totalGeral = 0;

    if (cart.length === 0) {
        cartList.innerHTML = '<li class="empty-msg">Nenhum item na sacola.</li>';
        totalDisplay.innerText = "0,00";
        return;
    }

    cart.forEach((item, index) => {
        totalGeral += item.price;
        const li = document.createElement('li');
        li.className = "cart-item";
        
        li.innerHTML = `
            <div class="cart-item-info">
                <strong>${index + 1}. ${item.name}</strong><br>
                <small>Extras: ${item.toppings.join(', ') || 'Nenhum'}</small><br>
                <span>R$ ${item.price.toFixed(2).replace('.', ',')}</span>
            </div>
            <button type="button" class="btn-remove" onclick="removeItem(${index})">
                Remover 🗑️
            </button>
        `;
        cartList.appendChild(li);
    });

    totalDisplay.innerText = totalGeral.toFixed(2).replace('.', ',');
}

// Limpa as seleções de tamanho e adicionais após adicionar à sacola
function resetSelections() {
    document.getElementById('size').value = "0";
    document.querySelectorAll('.topping').forEach(cb => cb.checked = false);
}


// 3. ENVIO DO PEDIDO PARA WHATSAPP
function sendOrder() {
    const phoneNumber = "553298207289"; // Coloca o número real aqui
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const payment = document.getElementById('payment').value;

    if (cart.length === 0) {
        alert("Sua sacola está vazia! Adicione pelo menos um açaí.");
        return;
    }

    if (!name || !address || !payment) {
        alert("Por favor, preencha seu nome, endereço e forma de pagamento.");
        return;
    }

    // Organiza a lista de produtos com espaços extras
    let itemsMessage = "";
    cart.forEach((item, i) => {
        itemsMessage += `*${i+1}º Açaí:* ${item.name}\n`;
        itemsMessage += `+ Adicionais: ${item.toppings.join(', ') || 'Nenhum'}\n\n`; // Espaço duplo aqui
    });

    // Lógica do texto de pagamento
    let paymentDetail = payment;
    if (payment === 'Dinheiro') {
        const needChange = document.querySelector('input[name="needChange"]:checked').value;
        if (needChange === 'sim') {
            const val = document.getElementById('changeValue').value;
            paymentDetail += ` (Levar troco para R$ ${val})`;
        } else {
            paymentDetail += ` (Não precisa de troco)`;
        }
    }

    // Montagem da mensagem com "Super Espaçamento"
    // Usamos \n\n (duas quebras) para forçar o WhatsApp a separar os blocos
    const finalMessage = 
        `*🍧 NOVO PEDIDO - MADÊ AÇAÍ*` + `\n\n` +
        
        `*👤 CLIENTE:*` + `\n` + 
        `${name}` + `\n\n` +
        
        `*📦 PRODUTOS:*` + `\n` + 
        `${itemsMessage}` +
        
        `*📍 ENDEREÇO:*` + `\n` + 
        `${address}` + `\n\n` +
        
        `*💳 PAGAMENTO:*` + `\n` + 
        `${paymentDetail}` + `\n\n` +
        
        `*💰 TOTAL GERAL:*` + `\n` + 
        `*R$ ${document.getElementById('totalValue').innerText}*` + `\n\n` +
        
        `_Enviado pelo site do Madê Açaí_`;

    // O encodeURIComponent garante que o WhatsApp receba os espaços corretamente
    const encodedMessage = encodeURIComponent(finalMessage);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
}