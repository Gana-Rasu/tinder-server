const PORT = 8000;
const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config()

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json("Tinder app");
});

const MONGO_URL = process.env.MONGO_URL;

app.post("/signup", async (req, res) => {

  const client = new MongoClient(MONGO_URL);

  const { email, password } = req.body; //taking email and password as input
  const generateUserId = uuidv4; //generating userid from uuid package
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

      // create token
    const token = jwt.sign(insertUser, sanitizedEmail, { expiresIn: 60 * 24 });
    res.status(201).json({ token});
  } 
  catch (error) {
    res.status(500).json({ Message: "Something went wrong" });
    console.log(error);
  }

});

app.post("/login", async (req, res) => {
  const client = new MongoClient(MONGO_URL);
  const {email,password} = req.body;

  try {
    await client.connect();
    const user = await client
      .db("app-data")
      .collection("users")
      .findOne({email});

      const correctPassword = await bcrypt.compare(password,user.hashed_passedword)
      if(user && correctPassword){
        const token = jwt.sign(user, email, { expiresIn: 60 * 24 });
        res.status(201).json({token})
      }
    res.status(400).send("Invalid credentials");
  }
   catch (error) {
    console.log(error);
  }

})

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
  }
   catch (error) {
    res.status(500).json({ Message: "Something went wrong" });
    console.log(error);
  }

});

app.listen(PORT, () => {
  console.log(`app started in ${PORT}`);
});
