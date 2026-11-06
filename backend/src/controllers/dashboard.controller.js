const DashboardModel = require('../models/dashboard.model');
const envolver = require('../utils/envolver');

module.exports = envolver({
  async resumen(req, res) {
    res.json(await DashboardModel.resumen());
  },
});
