const db = require("./model");

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
var jwt = require("jsonwebtoken");
const fileupload = require("express-fileupload");
app.use(fileupload());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.listen(3000, () => {
  console.log("Server started on port 3000");
});

const { user, notificationlog } = require("./schema");

function validEmail(e) {
  const patt = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return patt.test(e);
}

require("dotenv").config();

// ==================================user post=====================================================

app.post("/api/user/create", async (req, res) => {
  try {
    const userId = req.body.UserId;
    const email = req.body.Email;
    const marketing = req.body.Marketing;
    const newsletter = req.body.Newsletter;
    const updates = req.body.Updates;
    const frequency = req.body.Frequency;
    const emailSts = req.body.EmailSts;
    const smsSts = req.body.SmsSts;
    const pushSts = req.body.PushSts;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const today = new Date();

    if (
      !userId ||
      !email ||
      !marketing ||
      !newsletter ||
      !updates ||
      !frequency ||
      !emailSts ||
      !smsSts ||
      !pushSts
    ) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    if (frequency) {
      if (
        frequency.toLowerCase() !== "daily" &&
        frequency.toLowerCase() !== "weekly" &&
        frequency.toLowerCase() !== "monthly" &&
        frequency.toLowerCase() !== "never"
      ) {
        res.status(400).json({ error: "Invalid frequency" });
        return;
      }
    }

    const existingUser = await user.findOne({ userId });
    if (existingUser) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    if (!validEmail(email)) {
      console.log("Invalid email address");
      res.status(400).json({ error: "Invalid email address" });
      return;
    }

    jwt.sign({ userId }, process.env.ACCESS_TOKEN, async (err, token) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: "Internal server error" });
        return;
      }

      const userData = {
        userId,
        email,
        preferences: {
          marketing,
          newsletter,
          updates,
          frequency,
          channels: {
            email: emailSts,
            sms: smsSts,
            push: pushSts,
          },
        },
        timezone,
        lastUpdated: today,
        createdAt: today,
      };
      const userdata = new user(userData);
      // console.log(userdata);

      await userdata.save();
      res
        .status(200)
        .json({ message: "User created successfully", token: token });
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =====================================token verification============================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
    return res.sendStatus(401);
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

// ==================================user get======================================================

app.get("/api/user/get", authenticateToken, async (req, res) => {
  try {
    const userId = req.query.UserId;
    const email = req.query.Email;
    const params = {};
    if (userId) {
      params.userId = userId;
    }
    if (email) {
      params.email = email;
    }

    const userdata = await user.find(params);

    if (!userdata) {
      res.status(404).json({ error: "User not found" });
      return;
    } else {
      res.send(userdata);
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================user update===================================================

app.post("/api/user/update", authenticateToken, async (req, res) => {
  try {
    const {
      userId,
      email,
      marketing,
      newsletter,
      updates,
      frequency,
      emailSts,
      smsSts,
      pushSts,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Please provide UserId" });
    }

    const olduserData = await user.findOne({ userId });
    if (!olduserData) {
      return res.status(404).json({ error: "User not found" });
    }

    // console.log(olduserData.preferences.marketing);

    const today = new Date();

    if (email) {
      if (!validEmail(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }
      olduserData.email = email;
    }

    if (marketing) {
      if (
        typeof marketing !== "string" ||
        (marketing.toLowerCase() !== "false" &&
          marketing.toLowerCase() !== "true")
      ) {
        res.status(400).json({ error: "Invalid Marketing" });
        return;
      }
      olduserData.preferences.marketing = marketing;
    }

    if (newsletter !== undefined) {
      if (
        typeof newsletter !== "string" ||
        (newsletter.toLowerCase() !== "false" &&
          newsletter.toLowerCase() !== "true")
      ) {
        res.status(400).json({ error: "Invalid newsletter" });
        return;
      }
      olduserData.preferences.newsletter = newsletter;
    }

    if (updates !== undefined) {
      if (
        typeof updates !== "string" ||
        (updates.toLowerCase() !== "false" && updates.toLowerCase() !== "true")
      ) {
        res.status(400).json({ error: "Invalid updates" });
        return;
      }
      olduserData.preferences.updates = updates;
    }

    if (frequency) {
      const validFrequencies = ["daily", "weekly", "monthly", "never"];
      if (!validFrequencies.includes(frequency.toLowerCase())) {
        return res.status(400).json({ error: "Invalid frequency" });
      }
      olduserData.preferences.frequency = frequency.toLowerCase();
    }

    if (emailSts !== undefined) {
      if (
        typeof emailSts !== "string" ||
        (emailSts.toLowerCase() !== "false" &&
          emailSts.toLowerCase() !== "true")
      ) {
        res.status(400).json({ error: "Invalid emailSts" });
        return;
      }
      olduserData.preferences.channels.email = emailSts;
    }

    if (smsSts !== undefined) {
      if (
        typeof smsSts !== "string" ||
        (smsSts.toLowerCase() !== "false" && smsSts.toLowerCase() !== "true")
      ) {
        res.status(400).json({ error: "Invalid smsSts" });
        return;
      }
      olduserData.preferences.channels.sms = smsSts;
    }

    if (pushSts !== undefined) {
      if (
        typeof pushSts !== "string" ||
        (pushSts.toLowerCase() !== "false" && pushSts.toLowerCase() !== "true")
      ) {
        res.status(400).json({ error: "Invalid pushSts" });
        return;
      }
      olduserData.preferences.channels.push = pushSts;
    }

    olduserData.lastUpdated = today;

    const updatedUser = await user.findOneAndUpdate(
      { userId: userId },
      { $set: olduserData },
      { new: true }
    );

    updatedUser.save();

    res.status(200).json({ message: "Successfully updated", updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================user delete ===================================================

app.post("/api/user/delete", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Please provide UserId" });
    }
    const olduserData = await user.findOne({ userId: userId });
    if (!olduserData) {
      return res.status(404).json({ error: "User not found" });
    }

    await user.findOneAndDelete({ userId: userId });

    res.status(200).json({ message: "Successfully deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===================================nodemail==============================================
const nodemailer = require("nodemailer");

const nodemail = (mail, subject, text) => {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "boopathiperiyasamy2@gmail.com",
        pass: "snfx ibey clwt pbbe",
      },
    });

    const mailOptions = {
      from: "boopathiperiyasamy2@gmail.com",
      to: mail,
      subject: subject,
      text: text,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(false);
      } else {
        resolve(true);
      }
    });
  });
};

module.exports = nodemail;

// ================================notification log==============================================

app.post("/api/notificationlog/create", authenticateToken, async (req, res) => {
  try {
    const userId = req.body.UserId;
    const type = req.body.Type;
    const channel = req.body.Channel;
    var status = req.body.Status ? req.body.Status : "pending";
    var failureReason = req.body.FailureReason
      ? req.body.FailureReason
      : "No Failure";
    const today = new Date();
    const metadata = req.body.Metadata ? JSON.parse(req.body.Metadata) : {};

    if (!userId || !type || !channel || !metadata) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const userdata = await user.findOne({ userId: userId });
    if (!userdata) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (type != "marketing" && type != "newsletter" && type != "updates") {
      res.status(400).json({ error: "Invalid type" });
      return;
    }
    if (channel !== "email" && channel !== "sms" && channel !== "push") {
      res.status(400).json({ error: "Invalid channel" });
      return;
    }

    if (status !== "success" && status !== "failure" && status !== "pending") {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    if (channel.toLowerCase() == "email") {
      if (userdata.preferences.channels.email.toLowerCase() == "false") {
        const result = await nodemail(
          userdata.email,
          metadata.subject,
          metadata.text
        );

        if (result) {
          status = "success";
          failureReason = "No Failure";
        } else {
          status = "failure";
          failureReason = "Failed to send email";
        }
      } else {
        res.status(400).json({ error: "Email is not enabled" });
        return;
      }
    }

    const notificationLog = new notificationlog({
      userId: userId,
      type: type,
      channel: channel,
      status: status,
      failureReason: failureReason,
      metadata: metadata,
      sentAt: today,
    });

    await notificationLog.save();

    res.status(200).json({ message: "Successfully created" });
  } catch (error) {
    console.error("Error creating notification log:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =======================================notification get by userid===============================================

app.get("/api/notificationlog/get", authenticateToken, async (req, res) => {
  try {
    const userId = req.query.UserId;
    const params = {};
    if (userId) {
      params.userId = userId;
    } else {
      res.status(400).json({ error: "Please provide UserId" });
      return;
    }

    const notificationdata = await notificationlog.find(params);

    if (notificationdata.length == 0) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    res.send(notificationdata);

    res.status(200).json(notificationdata);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ======================================notification sts get=============================================================

app.get("/api/notifications/stats", authenticateToken, async (req, res) => {
  try {
    const status = req.query.sts;
    const params = {};
    if (status) {
      params.status = status;
    } else {
      res.status(400).json({ error: "Please provide status" });
      return;
    }
    if (status !== "success" && status !== "failure" && status !== "pending") {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const notificationdata = await notificationlog.find(params);

    if (notificationdata.length == 0) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    res.send(notificationdata);

    res.status(200).json(notificationdata);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===========================================================================================================
