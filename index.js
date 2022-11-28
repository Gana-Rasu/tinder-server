const PORT = 8000;
const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json("Tinder app");
});

const MONGO_URL =
  "mongodb+srv://gana:orDMV5tzjpXSnRqT@cluster.ltmfm1q.mongodb.net/?retryWrites=true&w=majority";

app.post("/signup", async (req, res) => {
  const client = new MongoClient(MONGO_URL);
  const { email, password } = req.body; //taking email and password as input

  const generateUserId = uuidv4;        //generating userid from uuid package  
  const hashedpassedword = await bcrypt.hash(password, 10); //hashing password using bcrypt with 10 salts

  try {
    await client.connect();
    // finding data to see if it has the email already
    const userExist = await client
      .db("app-data")
      .collection("users")
      .findOne({ email });

    if (userExist) {
      return res.status(409).send("user already exist please login");
    }

    const sanitizedEmail = email.toLowerCase();
    // inserting data
    const data = {
      user_id: generateUserId,
      email: sanitizedEmail,
      hashed_passedword: hashedpassedword,
    };
    const insertUser = await client
      .db("app-data")
      .collection("users")
      .insertOne(data);

    const token = jwt.sign(insertUser, sanitizedEmail, { expiresIn: 60 * 24 });
    res
      .status(201)
      .json({ token, user_id: generateUserId, email: sanitizedEmail });
  } catch (error) {
    res.status(500).json({ Message: "Something went wrong" });
    console.log(error);
  }
});

app.get("/users", async (req, res) => {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const returnedUsers = await client
      .db("app-data")
      .collection("users")
      .find()
      .toArray();
    res.send(returnedUsers);
  } catch (error) {
    res.status(500).json({ Message: "Something went wrong" });
    console.log(error);
  }
});

app.listen(PORT, () => {
  console.log(`app started in ${PORT}`);
});
