const API = (() => {
  const URL = "http://localhost:3000";

  // fetch all cart items from server
  const getCart = () => {
    return fetch(`${URL}/cart`).then((res) => res.json());
  };

  // fetch all inventory items from server
  const getInventory = () => {
    return fetch(`${URL}/inventory`).then((res) => res.json());
  };

  // add a new item to cart on server
  const addToCart = (inventoryItem) => {
    return fetch(`${URL}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inventoryItem),
    }).then((res) => res.json());
  };

  // update the amount of a cart item on server
  const updateCart = (id, newAmount) => {
    return fetch(`${URL}/cart/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: newAmount }),
    }).then((res) => res.json());
  };

  // delete an item from cart on server
  const deleteFromCart = (id) => {
    return fetch(`${URL}/cart/${id}`, {
      method: "DELETE",
    }).then((res) => res.json());
  };

  // removes all items from cart on server
  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

/*model*/
const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;

    constructor() {
      this.#inventory = [];
      this.#cart = [];
      this.#onChange = () => { };
    }

    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange(); //re-render
    }

    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange(); //re-render
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }

  return {
    State,
    ...API, // re-export the API methods so Controller can call them
  };
})();

/*View*/
const View = (() => {
  //  references to DOM elements 
  const inventoryListEl = document.querySelector(".inventory__list");
  const cartListEl = document.querySelector(".cart__list");

  //  HTML for one inv item
  const createInventoryItem = (item) => {
    return `
      <li class="inventory-item" data-id="${item.id}">
        <span class="item-content">${item.content}</span>
        <button class="decrement">-</button>
        <span class="item-amount">0</span>
        <button class="increment">+</button>
        <button class="add-cart">Add to Cart</button>
      </li>
    `;
  };

  // HTML for one cart item
  const createCartItem = (item) => {
    return `
      <li class="cart-item" data-id="${item.id}">
        <span class="cart-content">
          ${item.content} x <span class="cart-amount">${item.amount}</span>
        </span>
        <button class="delete-btn">Delete</button>
        <button class="edit-btn">Edit</button>
      </li>
    `;
  };

  // HTML for a cart item in edit mode
  const createCartItemEditor = (item) => {
    return `
      <li class="cart-item editing" data-id="${item.id}">
        <span class="cart-content">${item.content}</span>
        <button class="decrement-edit">-</button>
        <span class="edit-amount">${item.amount}</span>
        <button class="increment-edit">+</button>
        <button class="save-btn">Save</button>
      </li>
    `;
  };

  // Render inventory 
  const renderInventory = (inventory) => {
    if (!inventoryListEl) return;
    const html = inventory.map((item) => createInventoryItem(item)).join("");
    inventoryListEl.innerHTML = html;
  };

  // Render cart 
  const renderCart = (cart) => {
    if (!cartListEl) return;
    const html = cart.map((item) => createCartItem(item)).join("");
    cartListEl.innerHTML = html;
  };

  // Replace one cart item in edit
  const showCartItemEditor = (cartItemEl, itemData) => {
    cartItemEl.outerHTML = createCartItemEditor(itemData);
  };

  // editor to normal
  const revertCartItemFromEditor = (editorEl, itemData) => {
    editorEl.outerHTML = createCartItem(itemData);
  };

  return {
    renderInventory,
    renderCart,
    showCartItemEditor,
    revertCartItemFromEditor,
  };
})();

/*controller*/
const Controller = ((model, view) => {
  //  app state
  const state = new model.State();

  //re-fetch the latest cart from server and update state
  const updateCartState = () => {
    return model.getCart().then((cartData) => {
      state.cart = cartData;
    });
  };

  // Increment/Decrement
  const handleInventoryAmountChange = () => {
    const inventoryContainer = document.querySelector(".inventory-container");
    inventoryContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("decrement")) {
        const parent = e.target.closest(".inventory-item");
        const amountSpan = parent.querySelector(".item-amount");
        let current = +amountSpan.textContent;
        if (current > 0) {
          amountSpan.textContent = current - 1;
        }
      }
      if (e.target.classList.contains("increment")) {
        const parent = e.target.closest(".inventory-item");
        const amountSpan = parent.querySelector(".item-amount");
        let current = +amountSpan.textContent;
        amountSpan.textContent = current + 1;
      }
    });
  };

  // Add item 
  const handleAddToCart = () => {
    const inventoryContainer = document.querySelector(".inventory-container");
    inventoryContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("add-cart")) {
        const parent = e.target.closest(".inventory-item");
        const id = +parent.dataset.id;
        const amount = +parent.querySelector(".item-amount").textContent;
        const content = parent.querySelector(".item-content").textContent;

        if (amount <= 0) return;

        // Check existing cart items
        const existing = state.cart.find((cartItem) => cartItem.id === id);
        if (!existing) {
          //add new
          model
            .addToCart({ id, content, amount })
            .then(() => updateCartState());
        } else {
          // update if present
          const newAmount = existing.amount + amount;
          model.updateCart(id, newAmount).then(() => updateCartState());
        }

        // Reset 
        parent.querySelector(".item-amount").textContent = 0;
      }
    });
  };

  // edit cart
  const handleEdit = () => {
    const cartContainer = document.querySelector(".cart-container");
    cartContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("edit-btn")) {
        const parent = e.target.closest(".cart-item");
        const id = +parent.dataset.id;
        const cartItemData = state.cart.find((c) => c.id === id);
        // switch to edit
        view.showCartItemEditor(parent, cartItemData);
      }
    });
  };

  // edit mode
  const handleEditAmount = () => {
    const cartContainer = document.querySelector(".cart-container");
    cartContainer.addEventListener("click", (e) => {
      const editorEl = e.target.closest(".cart-item.editing");
      if (!editorEl) return;

      const id = +editorEl.dataset.id;
      const amountSpan = editorEl.querySelector(".edit-amount");
      let current = +amountSpan.textContent;

      if (e.target.classList.contains("decrement-edit")) {
        if (current > 1) {
          amountSpan.textContent = current - 1;
        }
      }
      if (e.target.classList.contains("increment-edit")) {
        amountSpan.textContent = current + 1;
      }
      if (e.target.classList.contains("save-btn")) {
        // Save new amount to server
        const newAmount = +amountSpan.textContent;
        model.updateCart(id, newAmount).then(() => {
          updateCartState();
        });
      }
    });
  };

  // Delete from cart
  const handleDelete = () => {
    const cartContainer = document.querySelector(".cart-container");
    cartContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-btn")) {
        const parent = e.target.closest(".cart-item");
        const id = +parent.dataset.id;
        model.deleteFromCart(id).then(() => {
          updateCartState();
        });
      }
    });
  };

  //checkout
  const handleCheckout = () => {
    const checkoutBtn = document.querySelector(".checkout-btn");
    checkoutBtn.addEventListener("click", () => {
      model.checkout().then(() => {
        // Re-fetch cart and alert
        updateCartState().then(() => {
          alert("You have successfully checked out!");
        });
      });
    });
  };
  // Combine 
  const init = () => {
    // re-render for changes
    state.subscribe(() => {
      view.renderInventory(state.inventory);
      view.renderCart(state.cart);
    });

    // Fetch initial data from server
    Promise.all([model.getInventory(), model.getCart()])
      .then(([inventory, cart]) => {
        state.inventory = inventory;
        state.cart = cart;
      })
      .then(() => {
        // Bind event listeners
        handleInventoryAmountChange();
        handleAddToCart();
        handleEdit();
        handleEditAmount();
        handleDelete();
        handleCheckout();
      });
  };

  return {
    init,
  };
})(Model, View);

Controller.init();