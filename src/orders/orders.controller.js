const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

let updatePropertyNames = ["deliverTo", "mobileNumber", "status", "dishes"];

let createPropertyNames = ["deliverTo", "mobileNumber", "dishes"];

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

function checkStatus(req, res, next){
    const {data: {status}} = req.body;
    if (status && (status !== "pending" && status !== "preparing" && status !== "out-for-delivery" && status !== "delivered")) {
        return next({
          status: 400,
          message: "status invalid",
        });
    } else {
        next()
    }
}

function canDestroy(req, res, next){
    const order = res.locals.order
    if (order.status !== "pending") {
        return next({
          status: 400,
          message: "Order status must be pending",
        });
      } else {
        next()
      }
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

function orderHasDishes(req, res, next) {
  const {
    data: { dishes },
  } = req.body;
  if (dishes.length === 0 || !Array.isArray(dishes)) {
    next({
      status: 400,
      message: "Please make sure to add a dish to your order",
    });
  } else {
    next();
  }
}

function areOrderDishesValid(req, res, next) {
  const {data: { dishes }} = req.body;
  const isValid = dishes.reduce((acc, dish, index) => {
    if ( !dish.quantity || !dish.quantity > 0 || typeof dish.quantity !== "number") {
      acc.push(index);
      return acc;
    }
    return acc;
  }, []);

  if (!isValid.length) {
    return next();
  }

  if (isValid.length > 1) {
    const index = isValid.join(", ");
    next({
      status: 400,
      message: `Dishes ${index} must have a quantity that is an integer greater than 0.`,
    });
  }

  next({
    status: 400,
    message: `Dish ${isValid} must have a quantity that is an integer greater than 0.`,
  });
}

function isIdPropertyValid(req, res, next) {
  const {
    data: { id },
  } = req.body;
  const { orderId } = req.params;
  if (orderId === id || id === undefined || !id || id === null) {
    next();
  } else {
    next({
      status: 400,
      message: `Order id "${id}" does not match`,
    });
  }
}



function list(req, res, next) {
  res.json({ data: orders });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function update(req, res, next) {
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  
    if (status && (status !== "pending" && status !== "preparing" && status !== "out-for-delivery" && status !== "delivered")) {
      return next({
        status: 400,
        message: "Status invalid",
      });
    }
  
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;
  
    res.json({ data: order });
  }

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
  };

  orders.push(newOrder);

  res.status(201).json({ data: newOrder });
}

function destroy(req, res, next) {
   const order = res.locals.order;
  const index = orders.findIndex((o) => o.id === order.id);
  orders.splice(index, 1);

  res.sendStatus(204);
}

module.exports = {
  list,
  read: [orderExists, read],
  update: [
    orderExists,
    ...updatePropertyNames.map(bodyDataHas),
    isIdPropertyValid,
    orderHasDishes,
    areOrderDishesValid,
    checkStatus,
    update,
  ],
  create: [
    ...createPropertyNames.map(bodyDataHas),
    orderHasDishes,
    areOrderDishesValid,
    create,
  ],
  delete: [
    orderExists, 
    canDestroy,
    destroy,
],
};
