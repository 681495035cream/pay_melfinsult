const mongoose = require("mongoose");

const ConsultationSchema = new mongoose.Schema(
  {
    consultation_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    user_id: {
      type: String,
      required: true,
      index: true,
    },

    lawyer_id: {
      type: String,
      required: true,
      index: true,
    },

    case_id: {
      type: String,
      required: true,
      index: true,
    },

    // วันเวลานัดทนาย
    appointment_date: {
      type: Date,
      default: null,
    },

    // คำถามที่ต้องการปรึกษา
    question: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
    collection: "consultations",
  }
);

module.exports = mongoose.model(
  "Consultation",
  ConsultationSchema
);