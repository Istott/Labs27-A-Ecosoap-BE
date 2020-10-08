// @ts-check

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const authRequired = require('../middleware/authRequired');
const Orders = require('./orderModel');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const determinedPrice = await Orders.findBy({ priceDetermined: true });
    const undeterminedPrice = await Orders.findBy({ priceDetermined: false });
    res.status(200).json({ determinedPrice, undeterminedPrice });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Orders.findById(id);

    if (order) {
      res.status(200).json(order);
    } else {
      res.status(404).json({ error: 'OrderNotFound' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const newOrder = req.body;
  if (newOrder) {
    const id = newOrder.id || uuidv4();
    try {
      const existingOrder = await Orders.findById(id);

      if (!existingOrder) {
        const [order] = await Orders.create({ ...newOrder, id });
        res.status(200).json({ message: 'order created', order: order });
      } else {
        res.status(400).json({ message: 'order already exists' });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e.message });
    }
  } else {
    res.status(404).json({ message: 'Order missing' });
  }
});

router.put('/', async (req, res) => {
  const order = req.body;
  if (order) {
    const id = order.id || uuidv4();

    try {
      await Orders.findById(id);
    } catch (err) {
      res.status(404).json({
        message: `Could not find profile '${id}'`,
        error: err.message,
      });
    }

    try {
      const [updated] = await Orders.update(id, order);
      res.status(200).json({ message: 'order created', order: updated });
    } catch (err) {
      res.status(500).json({
        message: `Could not update order '${id}'`,
        error: err.message,
      });
    }
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Orders.findById(id);
    await Orders.remove(id);
    res
      .status(200)
      .json({ message: `Order '${id}' was deleted.`, order: order });
  } catch (err) {
    res.status(500).json({
      message: `Could not delete order with ID: ${id}`,
      error: err.message,
    });
  }
});

module.exports = router;
