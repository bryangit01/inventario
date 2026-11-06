const AuditoriaModel = require('../models/auditoria.model');
const envolver = require('../utils/envolver');

module.exports = envolver({
  async listar(req, res) {
    res.json(await AuditoriaModel.listar(req.query));
  },
});
