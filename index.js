const express = require('express');
const cors = require('cors');
const admin = require("firebase-admin");
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000;

// middleware  
app.use(cors());
app.use(express.json());




const serviceAccount = require("./firebaseAdminSDK.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});




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


        // making admin

        app.patch('/makeAdmin/:id', async (req, res) => {
            const id = req.params.id

            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: { role: 'admin' }
            }

            const result = await userCollection.updateOne(filter, updateDoc)

            res.send(result)
        })

        // making agent

        app.patch('/makeAgent/:id', async (req, res) => {
            const id = req.params.id

            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: { role: 'agent' }
            }

            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        // delete user from db and firebase

        app.delete('/deleteUser/:id', async (req, res) => {
            const deleteId = req.params.id

            const filter = { _id: new ObjectId(deleteId) }
            const user = await userCollection.findOne(filter)

            if (!user) {
                return res.status(404).send({ message: 'user not found' })
            }

            const firebaseUser = await admin.auth().getUserByEmail(user.email)


            await admin.auth().deleteUser(firebaseUser.uid)
            const result = await userCollection.deleteOne(filter)

            res.send(result)
        })


        // mark an agent fraud 

        app.patch('/markFraud/:id', async (req, res) => {
            const id = req.params.id

            const filter = { _id: new ObjectId(id) }

            const updateDoc = {
                $set: { isFraud: true }
            }

            const userResult = await userCollection.updateOne(filter, updateDoc)

            const fraudAgent = await userCollection.findOne(filter)
            if (!fraudAgent) {
                return res.status(404).send({ message: 'agent not found' })
            }

            const emailFilter = { agentEmail: fraudAgent.email };

            const deleteProperty = await propertyCollection.deleteMany(emailFilter)
            const deleteWishlist = await wishListCollection.deleteMany(emailFilter)
            const deleteOfferData = await offerDataList.deleteMany(emailFilter)

            res.send({ message: 'Marked as fraud successfully', deleteProperty, deleteWishlist, deleteOfferData })


        })






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

        // get offer data

        app.get('/offer', async (req, res) => {
            const email = req.query.email

            const result = await offerDataList.find({ agentEmail: email }).toArray()

            res.send(result)
        })

        // ----------------------------------------------------------------------------------------------------

        // bid handle 

        // accept an offer and reject others for the same property
        app.patch('/agentAccepted/:id', async (req, res) => {
            const id = req.params.id;

            // accept this offer
            const acceptResult = await offerDataList.updateOne(
                { _id: new ObjectId(id) },
                { $set: { status: 'accepted' } }
            );

            // find accepted offer details to get propertyId
            const acceptedOffer = await offerDataList.findOne({ _id: new ObjectId(id) });

            // reject other offers for the same property (except accepted one)
            const rejectOthers = await offerDataList.updateMany(
                {
                    propertyId: acceptedOffer.propertyId,
                    _id: { $ne: new ObjectId(id) }
                },
                { $set: { status: 'rejected' } }
            );

            res.send({ message: 'Offer accepted & others rejected', acceptResult, rejectOthers });
        });

        // reject an offer
        app.patch('/agentRejected/:id', async (req, res) => {
            const id = req.params.id;

            const rejectResult = await offerDataList.updateOne(
                { _id: new ObjectId(id) },
                { $set: { status: 'rejected' } }
            );

            res.send({ message: 'Offer rejected', rejectResult });
        });


        // delete rejected offer
        app.delete('/deleteOffer/:id', async (req, res) => {
            const id = req.params.id;
            const result = await offerDataList.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });




        // showing data for property bought route in user panel

        app.get('/boughtProperty', async (req, res) => {
            const singleEmail = req.query.email

            const result = await offerDataList.find({ buyerEmail: singleEmail }).toArray()

            res.send(result)
        })


        // getting all users from the database

        app.get('/allUsers', async (req, res) => {
            const result = await userCollection.find().toArray()

            res.send(result)
        })






















        // agent adding properties 
        // app.post('/addProperty', async (req, res) => {

        //     const property = req.body;

        //     const result = await propertyCollection.insertOne(property)

        //     res.send(result)

        // })

        app.post('/addProperty', async (req, res) => {
            const property = req.body;

            const result = await propertyCollection.insertOne(property);

            if (result.insertedId) {
                res.send({
                    insertedId: result.insertedId.toString(),
                    message: 'Property added successfully'
                });
            } else {
                res.status(500).send({ message: 'Failed to add property' });
            }
        });


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
