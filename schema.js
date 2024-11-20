const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  userId: String,

  email: String,

  preferences: {
    marketing: Boolean,

    newsletter: Boolean,

    updates: Boolean,

    frequency: String,

    channels: {
      email: Boolean,

      sms: Boolean,

      push: Boolean,
    },
  },

  timezone: String,

  lastUpdated: Date,

  createdAt: Date,
});

const notificationlogSchema = new mongoose.Schema({
  userId: String,

  type: String,

  channel: String,

  status: String,

  sentAt: Date,

  failureReason: String,

  metadata: Object,
});

const notificationlog = new mongoose.model(
  "notificationlog",
  notificationlogSchema
);

const user = new mongoose.model("user", userSchema);


module.exports = {
  user,
  notificationlog,
};