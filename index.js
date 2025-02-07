const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = () => {
    // define your method to get cart data
  };

  const getInventory = () => {
    // define your method to get inventory data
  };

  const addToCart = (inventoryItem) => {
    // define your method to add an item to cart
  };

  const updateCart = (id, newAmount) => {
    // define your method to update an item in cart
  };

  const deleteFromCart = (id) => {
    // define your method to delete an item in cart
  };

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

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {}
    set inventory(newInventory) {}

    subscribe(cb) {}
  }

  return {
    State,
    ...API,
  };
})();

const View = (() => {
  // implement your logic for View
  return {};
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const handleAddToCart = () => {};

  const handleEdit = () => {};

  const handleEditAmount = () => {};

  const handleDelete = () => {};

  const handleCheckout = () => {};

  const init = () => {};

  return {
    init,
  };
})(Model, View);

Controller.init();
