const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

let propertyNames = [
    "name",
    "description",
    "price",
    "image_url",
]



function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({ status: 400, message: `Must include a ${propertyName}` });
    };
  }

  function isPricePropertyValid(req, res, next){
        const { data: {price} } = req.body;
        if( typeof price === "number" && !isNaN(price) && price >= 0){
            next()
        } else {
            next({
                status: 400,
                message: "price",
            })
        }
  }

  function isIdPropertyValid(req, res, next){
    const {data: {id}} = req.body;
    const { dishId } = req.params
    if(dishId === id || id === undefined || !id || id === null){
        next()
    }else{
        next({
            status: 400,
            message: `Dish id "${id}" does not match`
        })
    }
  }

  function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if (foundDish) {
      res.locals.dish = foundDish;
      return next();
    }
    next({
      status: 404,
      message: `Dish id not found: ${dishId}`,
    });
  };


function list(req, res, next){
    res.json({data: dishes})
}

function read(req, res, next){
    res.json({ data: res.locals.dish})
}

function update(req, res){
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;
  
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;
  
    res.json({ data: dish });
  }

function create(req, res, next){
    const { data : {name, decription, price, image_url} = {} } = req.body;
    const newDish = {
            id: nextId(),
            name,
            decription,
            price,
            image_url,
        }

    dishes.push(newDish);
  
    res.status(201).json({ data: newDish });
  }

module.exports = {
    list,
    read: [dishExists, read],
    create: [...propertyNames.map(bodyDataHas), isPricePropertyValid, create],
    update: [dishExists, ...propertyNames.map(bodyDataHas), isIdPropertyValid, isPricePropertyValid, update],
}