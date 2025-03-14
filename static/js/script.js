document.addEventListener("DOMContentLoaded", function () {
    loadCategories();
    loadAllProducts();
    initializeCart();

    document.getElementById("cart-button").addEventListener("click", function () {
        document.querySelector("#cart").scrollIntoView({ behavior: "smooth" });
    });
});

function initializeCart() {
    let cart = [];

    const cartCount = document.getElementById("cart-count");
    const cartItemsContainer = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const proceedBtn = document.getElementById("proceed-btn");

    // Function to update cart count
    function updateCartCount() {
        let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? "inline" : "none";
    }

    // Function to update the cart UI
    function updateCartUI() {
        cartItemsContainer.innerHTML = ""; // Clear cart items
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
            proceedBtn.disabled = true; // Disable the proceed button when cart is empty
        } else {
            cart.forEach((item, index) => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <span>${item.name} - ₹${item.price} x ${item.quantity}</span>
                    <div class="cart-item-controls">
                        <button class="cart-btn" onclick="changeQuantity(${index}, 'decrease')">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="cart-btn" onclick="changeQuantity(${index}, 'increase')">+</button>
                        <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
                    </div>
                `;
                cartItemsContainer.appendChild(li);
                total += item.price * item.quantity;
            });
            proceedBtn.disabled = false; // Enable the proceed button when cart has items
        }

        cartTotal.textContent = total;
        updateCartCount();

        // Store total amount in localStorage
        localStorage.setItem("cartTotalAmount", total);
    }

    // Function to add item to cart
    function addToCart(id, name, price) {
        let existingItem = cart.find(item => item.id === id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price, quantity: 1 });
        }

        updateCartUI();
    }

    // Function to remove an item from the cart
    function removeFromCart(index) {
        cart.splice(index, 1);
        updateCartUI();
    }

    // Function to change item quantity
    function changeQuantity(index, action) {
        if (action === "increase") {
            cart[index].quantity += 1;
        } else if (action === "decrease" && cart[index].quantity > 1) {
            cart[index].quantity -= 1;
        }
        updateCartUI();
    }

    // Expose cart functions globally for button actions
    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
    window.changeQuantity = changeQuantity;

    // Initialize cart UI and count
    updateCartUI();
}

// Load Categories
function loadCategories() {
    attachCategoryEvents();
}

// Handle Category Clicks
function attachCategoryEvents() {
    document.querySelectorAll(".navbar-nav .nav-link").forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            const categoryText = this.textContent.trim();

            if (categoryText === "All") {
                loadAllProducts();
                clearSubcategories();
            } else {
                loadSubcategories(categoryText);
            }
        });
    });
}

// Load Subcategories
function loadSubcategories(category) {
    const categoryMap = {
        "Home Appliances": 1,
        "Televisions": 2,
        "Phones & Wearables": 3,
        "Computers & Tablets": 4,
        "Cameras & Accessories": 5,
        "Gaming": 6
    };
    const categoryId = categoryMap[category] || 0;

    fetch(`/api/subcategories/${categoryId}`)
        .then(response => response.json())
        .then(subcategories => {
            const list = document.getElementById("subcategory-list");
            list.innerHTML = "<h2>Subcategories</h2>";

            if (subcategories.length === 0) {
                list.innerHTML += "<p>No subcategories available</p>";
            } else {
                subcategories.forEach(sub => {
                    const button = document.createElement("button");
                    button.innerText = sub.name;
                    button.dataset.subcategoryId = sub.id;
                    button.addEventListener("click", () => loadProductsBySubcategory(sub.id));
                    list.appendChild(button);
                });
            }
        })
        .catch(error => {
            console.error("Error fetching subcategories:", error);
            const list = document.getElementById("subcategory-list");
            list.innerHTML = "<h2>Subcategories</h2><p>Error loading subcategories</p>";
        });
}

// Clear Subcategories
function clearSubcategories() {
    const list = document.getElementById("subcategory-list");
    list.innerHTML = "<h2>Subcategories</h2>";
}

// Load All Products
function loadAllProducts() {
    fetch("/api/products")
        .then(response => response.json())
        .then(displayProducts)
        .catch(error => console.error("Error fetching products:", error));
}

// Load Products by Subcategory
function loadProductsBySubcategory(subcategoryId) {
    fetch("/api/products")
        .then(response => response.json())
        .then(products => {
            const filteredProducts = products.filter(p => p.subcategory_id === subcategoryId);
            displayProducts(filteredProducts);
        })
        .catch(error => console.error("Error fetching products:", error));
}

// Display Products
function displayProducts(products) {
    const productList = document.getElementById("product-list");
    productList.innerHTML = "";

    if (products.length === 0) {
        productList.innerHTML = "<p>No products available</p>";
    } else {
        products.forEach(product => {
            const card = document.createElement("div");
            card.classList.add("product-card");
            card.innerHTML = `
                <img src="${product.image_url}" alt="${product.name}" />
                <h3>${product.name}</h3>
                <p>₹${product.price}</p>
                <button onclick="addToCart(${product.id}, '${product.name}', ${product.price})">Add to Cart</button>
            `;
            productList.appendChild(card);
        });
    }
}

// Open Payment Form with Empty Cart Check
function openPaymentForm() {
    const cartItems = document.getElementById("cart-items").children;
    if (cartItems.length === 0 || cartItems[0].textContent === "Your cart is empty.") {
        // Show alert message instead of opening payment form
        alert("Your cart is empty! Please add items to your cart before proceeding to payment.");
    } else {
        document.getElementById("payment-form").style.display = "block";
    }
}