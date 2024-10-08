const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;


// middleware

app.use(cors());
app.use(express.json());

console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g0rz6ma.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const verifyJWT = (req, res, next)=>{
console.log('hitting verify JWT');
console.log(req.headers.authorization);
const authorization = req.headers.authorization;
if(!authorization){
  return res.status(401).send({error: true, message: "unauthorized access"})
}
const token = authorization.split(' ')[1];
console.log('token inside verify JWT', token);
jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded)=>{
  if(error){
    return res.status(404).send({error: true, message: 'unauthorized access'})
  }
  req.decoded = decoded;
  next();
})
}



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();


    const serviceCollection = client.db('carDoctorAgain').collection('services');
    const bookingCollection = client.db('carDoctorAgain').collection('bookings')

    //JWT
    app.post('/jwt', (req, res)=>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: 10
      });
      res.send({token})
    })



    app.get('/services', async(req, res)=>{
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get('/services/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await serviceCollection.findOne(query);
        res.send(result);
    })


    // bookings

    app.get('/bookings', verifyJWT, async(req, res)=>{
      const decoded = req.decoded;
        console.log('came back after verify', decoded);

        if(decoded.email !== req.query.email){
          return res.status(403).send({error: true, message: 'forbidden access'})
        }



        let query ={};
        if(req.query?.email){
            query = {email: req.query.email}
        }
        const result = await bookingCollection.find(query).toArray();
        res.send(result);
    })


    app.post('/bookings', async(req, res)=>{
        const bookings = req.body;
        console.log(bookings);
        const result = await bookingCollection.insertOne(bookings);
        res.send(result);
    })


    app.patch('/bookings/:id', async(req, res)=>{

        const id = req.params.id;
        const filter = {_id:new ObjectId(id)}
        const updatedBookings = req.body;
        console.log(updatedBookings);
        const updateDoc = {
            $set: {
              status: updatedBookings.status
            },
          };
          const result = await bookingCollection.updateOne(filter, updateDoc);
          res.send(result);
    })


    app.delete('/bookings/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await bookingCollection.deleteOne(query)
        res.send(result);
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res)=>{
    res.send('doctor server is working')
})

app.listen(port, ()=>{
    console.log(`car doctor port running on port ${port}`);
})