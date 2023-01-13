const PORT = process.env.PORT || 4000;
const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const bcrypt = require("bcrypt");
require("dotenv").config();

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
  const generateUserId = uuidv4(); //generating userid from uuid package
  const hashedpassedword = await bcrypt.hash(password, 10); //hashing password using bcrypt with 10 salts

  try {
    await client.connect();
    console.log("mongodb connected");
    // finding data to see if it has the email already
    const userExist = await client
      .db("app-data")
      .collection("users")
      .findOne({ email });

    if (userExist) {
      return res.status(409).send("user already exist please login");
    }

    const sanitizedEmail = email.toLowerCase();
    // console.log(generateUserId);
    // inserting data
    const data = {
      user_id: generateUserId,
      email: sanitizedEmail,
      hashed_passedword: hashedpassedword,
    };
    console.log(data);
    const insertUser = await client
      .db("app-data")
      .collection("users")
      .insertOne(data);

    // create token
    const token = jwt.sign(insertUser, sanitizedEmail, { expiresIn: 60 * 24 });
    res.status(201).json({ token, userId: generateUserId });
  } catch (error) {
    res.status(500).json({ Message: "Something went wrong" });
    console.log(error);
  }
  finally {
    await client.close()
}
});


app.post("/login", async (req, res) => {
  const client = new MongoClient(MONGO_URL);
  const { email, password } = req.body;

  try {
    await client.connect();
    const user = await client
      .db("app-data")
      .collection("users")
      .findOne({ email });

    const correctPassword = await bcrypt.compare(
      password,
      user.hashed_passedword
    );
    if (user && correctPassword) {
      const token = jwt.sign(user, email, { expiresIn: 60 * 24 });
      res.status(201).json({ token, userId: user.user_id });
    } else {
      res.status(400).send("Invalid credentials");
    }
  } catch (error) {
    console.log(error);
  }
});



app.get("/gendered-users/:gender", async (req, res) => {
  const client = new MongoClient(MONGO_URL);
  const gender = req.params.gender;

  // console.log("gender", gender);

  try {
    await client.connect();
    const foundUsers = await client
      .db("app-data")
      .collection("users")
      .find({ gender_identity: gender })
      .toArray();
    res.send(foundUsers);
  } catch (error) {
    res.status(500).json({ Message: "Something went wrong" });
    console.log(error);
  }
  finally {
    await client.close()
}
});


app.get("/user/:userId", async (req, res) => {
  const client = new MongoClient(MONGO_URL);
  const userId = req.params.userId;

  // console.log(req.params);
  // console.log(userId);

  try {
    await client.connect();
    const user = await client
      .db("app-data")
      .collection("users")
      .findOne({ user_id: userId });

    // const database = await client.db("app-data").collection("users");
    // console.log(database);
    // const query = { userId: userId };
    // const user = database.findOne(query);
    res.send(user);
  } finally {
    await client.close();
  }
});


app.put("/user", async (req, res) => {
  const client = new MongoClient(MONGO_URL);
  const formData = req.body.formData;

  try {
    await client.connect();
    const database = await client.db("app-data").collection("users");
    // console.log(formData.user_id);
    const query = { user_id: formData.user_id };

    const updateDocument = {
      $set: {
        first_name: formData.first_name,
        dob_day: formData.dob_day,
        dob_month: formData.dob_month,
        dob_year: formData.dob_year,
        show_gender: formData.show_gender,
        gender_identity: formData.gender_identity,
        gender_interest: formData.gender_interest,
        url: formData.url,
        about: formData.about,
        matches: formData.matches,
      },
    };
    // console.log(updateDocument);
    const insertedUser = await database.updateOne(query, updateDocument);
    res.send(insertedUser);
  } finally {
    await client.close();
  }
});



app.put("/addmatch", async (req, res) => {
  const client = new MongoClient(MONGO_URL);
  const { userId, matchedUserId } = req.body;
console.log(userId,matchedUserId);
  try {
    await client.connect();
    const database = await client
      .db("app-data")
      .collection("users");

      const query = {user_id: userId}
      const updateDocument = {
          $push: {matches: {user_id: matchedUserId}}
      }
      // logged in user matching with the swiped user and updating the matches array the swiped userid
      const user = await database.updateOne(query, updateDocument)
      res.send(user)
  } catch (error) {
    console.log(error);
  }
  finally {
    await client.close()
}
});


app.listen(PORT, () => {
  console.log(`app started in ${PORT}`);
});
