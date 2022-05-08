const express = require('express');
const cors = require('cors');
require('dotenv').config();
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zgbvl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('laptopStore').collection('Item');

        app.get('/item', async (req, res) => {
            // const query = {};
            let query = {};
            if (req.query.addedBy) {
                const addedBy = req.query.addedBy;
                query = { addedBy };
            }
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });
        app.get('/item/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const item = await serviceCollection.findOne(query);
            res.send(item);
        });

        app.post('/item', async (req, res) => {
            const newItem = req.body;

            const tokenInfo = req.headers.authorization;
            const [email, accessToken] = tokenInfo.split(" ")
            // console.log(email, accessToken)
            const decoded = verifyToken(accessToken)

            if (email === decoded.email) {
                const result = await serviceCollection.insertOne(newItem);
                res.send({ success: 'Item Added Successfully' })
            }
            else {
                res.send({ success: 'UnAuthoraized Access' })
            }


            // res.send(result);
        });

        app.delete('/item/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        });

        app.put('/item/:id', async (req, res) => {
            const id = req.params.id;
            const updateUser = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    quantity: updateUser.newQuantity
                }
            };
            const result = await serviceCollection.updateOne(filter, updateDoc, options);
            res.send(result);

        });

        //Auth
        app.post('/login', async (req, res) => {
            const email = req.body;
            const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
            res.send({ token });
        })
    }
    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Running Rishat laptop store');
});

app.listen(port, () => {
    console.log('listening to port', port);
});

function verifyToken(token) {
    let email;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            email = 'Invalid email'
        }
        if (decoded) {
            // console.log(decoded)
            email = decoded
        }
    });
    return email;
}