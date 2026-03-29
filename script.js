let cart = [];

// 1. LÓGICA DE PAGAMENTO E VISIBILIDADE
function handlePaymentChange() {
    const payment = document.getElementById('payment').value;
    const cashOptions = document.getElementById('cash-options');
    const pixOptions = document.getElementById('pix-options');
    
    // Mostra opções de dinheiro apenas se selecionado
    cashOptions.style.display = (payment === 'Dinheiro') ? 'block' : 'none';
    
    // Mostra chave Pix apenas se selecionado
    pixOptions.style.display = (payment === 'Pix') ? 'block' : 'none';
}

function toggleChangeInput() {
    const needChange = document.querySelector('input[name="needChange"]:checked').value;
    const changeInputDiv = document.getElementById('change-input-div');
    
    // Mostra campo de valor do troco apenas se marcar "Sim"
    changeInputDiv.style.display = (needChange === 'sim') ? 'block' : 'none';
}

// 2. FUNÇÃO PARA COPIAR A CHAVE PIX
function copyPixKey() {
    const key = document.getElementById('pix-key').innerText;
    navigator.clipboard.writeText(key).then(() => {
        alert("Chave Pix copiada! Agora é só colar no seu aplicativo do banco. ✅");
    }).catch(err => {
        console.error('Erro ao copiar chave: ', err);
    });
}

// 3. LÓGICA DA SACOLA (CARRINHO)
function addItemToCart() {
    const sizeSelect = document.getElementById('size');
    const sizeValue = parseFloat(sizeSelect.value);
    
    if (sizeValue === 0 || isNaN(sizeValue)) {
        alert("Escolha o tamanho do açaí primeiro!");
        return;
    }

    const sizeText = sizeSelect.options[sizeSelect.selectedIndex].text;
    let toppings = [];
    let toppingsPrice = 0;

    // Soma os adicionais marcados
    document.querySelectorAll('.topping:checked').forEach(item => {
        toppings.push(item.value);
        toppingsPrice += parseFloat(item.getAttribute('data-price'));
    });

    const totalItem = sizeValue + toppingsPrice;

    // Adiciona ao carrinho
    cart.push({
        name: sizeText,
        toppings: toppings,
        price: totalItem
    });

    updateCartUI();
    resetSelections();
}

function removeItem(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    const cartList = document.getElementById('cart-list');
    const totalDisplay = document.getElementById('totalValue');
    cartList.innerHTML = "";
    let totalGeral = 0;

    if (cart.length === 0) {
        cartList.innerHTML = '<li class="empty-msg">Sua sacola está vazia...</li>';
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
                <small>+ ${item.toppings.join(', ') || 'Sem extras'}</small><br>
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

function resetSelections() {
    document.getElementById('size').value = "0";
    document.querySelectorAll('.topping').forEach(cb => cb.checked = false);
}

// 4. ENVIO PARA O WHATSAPP (COM SUPER ESPAÇAMENTO)
function sendOrder() {
    const phoneNumber = "5532998207289"; // Coloque o número real aqui!
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const payment = document.getElementById('payment').value;

    if (cart.length === 0 || !name || !address || !payment) {
        alert("Preencha seu nome, endereço, pagamento e adicione um açaí!");
        return;
    }

    // Organiza os itens com quebras de linha duplas
    let itemsText = "";
    cart.forEach((item, i) => {
        itemsText += `*${i+1}º Açaí:* ${item.name}\n`;
        itemsText += `+ Adicionais: ${item.toppings.join(', ') || 'Nenhum'}\n\n`;
    });

    let paymentInfo = payment;
    if (payment === 'Dinheiro') {
        const needChange = document.querySelector('input[name="needChange"]:checked').value;
        if (needChange === 'sim') {
            const val = document.getElementById('changeValue').value;
            paymentInfo += ` (Levar troco para R$ ${val})`;
        } else {
            paymentInfo += ` (Valor exato, sem troco)`;
        }
    } else if (payment === 'Pix') {
        paymentInfo += ` (Pagamento via chave Pix)`;
    }

    // Montagem da mensagem forçando quebras de linha (\n\n)
    const message = 
        `*🍧 NOVO PEDIDO - MADÊ AÇAÍ*` + `\n\n` +
        
        `*👤 CLIENTE:*` + `\n` + 
        `${name}` + `\n\n` +
        
        `*📦 PRODUTOS:*` + `\n` + 
        `${itemsText}` +
        
        `*📍 ENDEREÇO:*` + `\n` + 
        `${address}` + `\n\n` +
        
        `*💳 PAGAMENTO:*` + `\n` + 
        `${paymentInfo}` + `\n\n` +
        
        `*💰 TOTAL GERAL:*` + `\n` + 
        `*R$ ${document.getElementById('totalValue').innerText}*` + `\n\n` +
        
        `_Pedido enviado pelo site oficial_`;

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
}