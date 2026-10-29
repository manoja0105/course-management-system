const Report = require("../models/reportModel");

// Admin: system-wide overview
const getAdminOverview = async (req, res) => {
  try {
    const report = await Report.getAdminOverview();

    return res.status(200).json({
      message: "Admin report retrieved successfully",
      report,
    });
  } catch (error) {
    console.error("Error getting admin report:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Student: own report only (id comes from the JWT)
const getMyReport = async (req, res) => {
  try {
    const report = await Report.getStudentReport(req.user.id);

    return res.status(200).json({
      message: "Student report retrieved successfully",
      report,
    });
  } catch (error) {
    console.error("Error getting student report:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAdminOverview,
  getMyReport,
};