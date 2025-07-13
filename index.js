const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000;

// middleware  
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.SECRET_KEY}@cluster0.3cytdpf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {


        // creating collection

        const HomeVista = client.db("HomeVistaDatabase");
        const userCollection = HomeVista.collection("users")
        const propertyCollection = HomeVista.collection("PropertyCollection")
        const wishListCollection = HomeVista.collection("wishList")
        const offerDataList = HomeVista.collection('offerData')


        // saving user 

        app.post("/users", async (req, res) => {

            const email = req.body.email

            const existing = await userCollection.findOne({ email })

            if (existing) {
                return res.send({ message: 'User already exists', inserted: false });
            }

            const user = req.body;

            const result = await userCollection.insertOne(user)

            res.send(result)

        })

        // getting user data

        app.get("/user", async (req, res) => {
            const email = req.query.email;
            const user = await userCollection.findOne({ email: email });
            res.json(user);
        });

        // all user wishList

        app.post("/wishList", async (req, res) => {
            const wishProperty = req.body

            const result = await wishListCollection.insertOne(wishProperty);

            res.send(result)
        })

        // get specific users wishlist

        app.get('/wishlist', async (req, res) => {
            const userEmail = req.query.email;
            const result = await wishListCollection.find({ email: userEmail }).toArray();
            res.send(result);
        });

        // delete users wishlist items

        app.delete('/wishlist/:id', async (req, res) => {
            const id = req.params.id

            const query = { _id: new ObjectId(id) }

            const result = await wishListCollection.deleteOne(query)

            res.send(result)
        })

        // get data for offer bid

        app.get('/makeOffer/:id', async (req, res) => {
            const id = req.params.id

            const query = { _id: new ObjectId(id) }

            const result = await wishListCollection.findOne(query)

            res.send(result)
        })

        // saving offer data 
        app.post('/offers', async (req, res) => {
            const offerData = req.body

            const result = await offerDataList.insertOne(offerData)

            res.send(result)
        })




        // agent adding properties 
        app.post('/addProperty', async (req, res) => {

            const property = req.body;

            const result = await propertyCollection.insertOne(property)

            res.send(result)

        })

        // loading unverified properties for admin verify

        app.get('/unverified', async (req, res) => {

            const result = await propertyCollection.find({ isVerified: false }).toArray()

            res.send(result)
        })


        // verified property to display

        app.get("/verifiedProperties", async (req, res) => {
            const result = await propertyCollection.find({ isVerified: true }).toArray()

            res.send(result)
        })

        // getting single properties for details page

        app.get("/details/:id", async (req, res) => {
            const id = req.params.id

            const query = { _id: new ObjectId(id) }

            const result = await propertyCollection.findOne(query)

            res.send(result)
        })

        // showing all properties of agent 

        app.get('/agentAddedProperties', async (req, res) => {
            const agentEmail = req.query.email

            const result = await propertyCollection.find({ agentEmail: agentEmail }).toArray()

            res.send(result)
        })



        // admin approved routes

        app.patch('/adminVerifyProperties/:id', async (req, res) => {

            const id = req.params.id

            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: { isVerified: true }
            }

            const result = await propertyCollection.updateOne(filter, updateDoc);

            res.send(result);

        })

        // admin rejected routes

        app.patch('/adminRejectedProperties/:id', async (req, res) => {

            const id = req.params.id

            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: { isVerified: "rejected" }
            }

            const result = await propertyCollection.updateOne(filter, updateDoc);

            res.send(result);

        })

        // server.js বা routes file এ
        app.patch('/updateProperty/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const updatedProperty = req.body;

                const filter = { _id: new ObjectId(id) };

                const updateDoc = {
                    $set: {
                        propertyName: updatedProperty.propertyName,
                        location: updatedProperty.location,
                        minimumPrice: updatedProperty.minimumPrice,
                        maximumPrice: updatedProperty.maximumPrice,
                        isVerified: false  // ✅ update এর পর always verify এর জন্য admin এর কাছে যাবে
                    }
                };

                const result = await propertyCollection.updateOne(filter, updateDoc);
                res.send(result);

            } catch (error) {
                console.error('Update failed:', error);
                res.status(500).send({ message: 'Update failed', error });
            }
        });



        // Delete property by agent

        app.delete('/deleteProperty/:id', async (req, res) => {
            const id = req.params.id

            const query = { _id: new ObjectId(id) }

            const result = await propertyCollection.deleteOne(query)

            res.send(result)
        })

























        // Send a ping to confirm a successful connection
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("Lets sell some property")
})

app.listen(port, () => {
    console.log(`server is running at port ${port}`)
})
