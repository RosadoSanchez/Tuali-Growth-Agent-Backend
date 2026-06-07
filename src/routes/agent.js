const express = require("express");
const router = express.Router();

router.post("/query", async (req, res) => {

  const { question } = req.body;

  res.json({
    success: true,
    answer: `Recibí la pregunta: ${question}`
  });

});

module.exports = router;