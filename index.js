const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");

app.use(bodyParser.raw({ type: "*/*" }));
app.use(cors());
app.use(morgan("combined"));

let usernamePassword = new Map();
let userToken = new Map();
let tokenUsername = new Map();
let listingdb = new Map();
let cartdb = new Map();
let userpurchases = new Map();

let token1 = ["unique", "awesome", "pure", "graceful", "perpetual"]
let token2 = ["wilderness", "rainbow", "leaves", "forest", "meadow"]

let counter = 1;
let itemcounter = 1;

app.get("/sourcecode", (req, res) => {
    res.send(require("fs").readFileSync(__filename).toString());
});

app.get("/", (req, res) => {
    res.send("Hello");
})

app.post("/signup", (req, res) => {
    let parsed = JSON.parse(req.body);
    let username = parsed.username;
    let password = parsed.password;

    if (username === undefined) {
        res.send({ "success": false, "reason": "username field missing" })
    }
    if (password === undefined) {
        res.send({ "success": false, "reason": "password field missing" })
    }
    if (usernamePassword.has(username)) {
        res.send({ "success": false, "reason": "Username exists" })
    }
    usernamePassword.set(username, password);
    userToken.set(username, { "password": password, "token": "" });
    res.send({ "success": true })
})

app.post("/login", (req, res) => {
    let parsed = JSON.parse(req.body);
    let username = parsed.username;
    let password = parsed.password;

    let randomNum1 = Math.round(Math.random() * 4);
    let randomNum2 = Math.round(Math.random() * 4);

    let token = String(token1[randomNum1] + "-" + token2[randomNum2] + "-" + counter);
    counter++;

    if (username === undefined) {
        res.send({ "success": false, "reason": "username field missing" })
    }
    if (password === undefined) {
        res.send({ "success": false, "reason": "password field missing" })
    }
    if (!usernamePassword.has(username)) {
        res.send({ "success": false, "reason": "User does not exist" })
    }
    let getPassword = usernamePassword.get(username);
    if (getPassword !== password) {
        res.send({ "success": false, "reason": "Invalid password" })
    }

    tokenUsername.set(token, username);
    let utoken = userToken.get(username);
    utoken.token = token;

    res.send({ "success": true, "token": token })
})

app.post("/change-password", (req, res) => {
    let parsed = JSON.parse(req.body);
    let oldPassword = parsed.oldPassword;
    let newPassword = parsed.newPassword;
    let token = req.header("token");
    let username = tokenUsername.get(token);

    let utoken = userToken.get(username);
    let gotpassword = utoken.password;

    if (token === undefined) {
        res.send({ "success": false, "reason": "token field missing" })
    }
    if (!tokenUsername.has(token)) {
        res.send({ "success": false, "reason": "Invalid token" })
    }
    if (oldPassword === undefined) {
        res.send({ "success": false, "reason": "password field missing" })
    }
    if (gotpassword !== oldPassword) {
        res.send({ "success": false, "reason": "Unable to authenticate" })
    }
    else {
        // gotpassword.splice(0,1)
        // gotpassword.push(newPassword);

        let jobject = userToken.get(username);
        jobject.password = newPassword;
    }
    res.send({ "success": true })
})

app.post("/create-listing", (req, res) => {
    let token = req.header("token");
    let parsed = JSON.parse(req.body);
    let price = parsed.price;
    let description = parsed.description;
    let username = tokenUsername.get(token);
    let itemid = "xyz" + counter;

    if (token === undefined) {
        res.send({ "success": false, "reason": "token field missing" })
    }
    if (!tokenUsername.has(token)) {
        res.send({ "success": false, "reason": "Invalid token" })
    }
    if (price === undefined) {
        res.send({ "success": false, "reason": "price field missing" })
    }
    if (description === undefined) {
        res.send({ "success": false, "reason": "description field missing" })
    }

    listingdb.set(itemid, { "price": price, "description": description, "itemId": itemid, "sellerUsername": username });
    counter++;

    res.send({ "success": true, "listingId": itemid })
})

app.get("/listing", (req, res) => {
    let listingid = req.query.listingId;

    if (!listingdb.has(listingid)) {
        res.send({ "success": false, "reason": "Invalid listing id" })
    };

    res.send({ "success": true, "listing": listingdb.get(listingid) })
})

app.post("/modify-listing", (req, res) => {
    let token = req.header("token");
    let parsed = JSON.parse(req.body);
    let itemid = parsed.itemid;
    let price = parsed.price;
    let description = parsed.description;

    if (token === undefined) {
        res.send({ "success": false, "reason": "token field missing" })
    }
    if (!tokenUsername.has(token)) {
        res.send({ "success": false, "reason": "Invalid token" })
    }
    if (itemid === undefined) {
        res.send({ "success": false, "reason": "itemid field missing" })
    }

    let founditem = listingdb.get(itemid);
    if (price !== undefined) {
        founditem.price = price;
    }
    if (description !== undefined) {
        founditem.description = description;
    }
    res.send({ "success": true });
})

app.post("/add-to-cart", (req, res) => {
    let token = req.header("token");
    let parsed = JSON.parse(req.body);
    let itemid = parsed.itemid;
    let username = tokenUsername.get(token);
    let founditem = listingdb.get(itemid); //this is still json object
    let x = 0;;
    let bool = true;

    if (!tokenUsername.has(token)) {
        bool = false;
        res.send({ "success": false, "reason": "Invalid token" })
    }
    if (itemid === undefined) {
        bool = false;
        res.send({ "success": false, "reason": "itemid field missing" })
    }
    if (!listingdb.has(itemid)) {
        bool = false;
        res.send({ "success": false, "reason": "Item not found" });
    }

    if (bool === true) {
        if (!cartdb.has(username)) {
            cartdb.set(username, []);
        }
        let array = cartdb.get(username);
        array.push(founditem);
    }

    res.send({ "success": true });
});

app.get("/cart", (req, res) => {
    let token = req.header("token");
    let username = tokenUsername.get(token);

    if (!tokenUsername.has(token)) {
        res.send({ "success": false, "reason": "Invalid token" })
    }
    let cartitems = cartdb.get(username);

    res.send({ "success": true, "cart": cartitems });
})

app.post("/checkout", (req, res) => {
    let token = req.header("token");
    let username = tokenUsername.get(token);
    let usercart = cartdb.get(username);

    if (!tokenUsername.has(token)) {
        res.send({ "success": false, "reason": "Invalid token" })
    }

    if (usercart === undefined) {
        res.send({ "success": false, "reason": "Empty cart" })
    }

    for (let i = 0; i < usercart.length; i++) {
        let itemid = usercart[i].itemId;
        if (!listingdb.has(itemid)) {
            res.send({ "success": false, "reason": "Item in cart no longer available" });
        }
    }

    for (let i = 0; i < usercart.length; i++) {
        let itemid = usercart[i].itemId;
        if (listingdb.has(itemid)) {

            userpurchases.set(username, usercart);
            let array = userpurchases.get(username);

            listingdb.delete(itemid);
        }
    }
    res.send({ "success": true })
})


app.get("/purchase-history", (req, res) => {
    let token = req.header("token");
    let username = tokenUsername.get(token);

    if (!tokenUsername.has(token)) {
        res.send({ "success": false, "reason": "Invalid token" })
    }
    let array = userpurchases.get(username);
    res.send({ "success": true, "purchased": array });
})
let chatMessages = new Map();

app.post("/chat", (req, res) => {

    let token = req.header("token");
    let parsed = JSON.parse(req.body);
    let contents = parsed.contents; //text message
    let destination = parsed.destination; //username
    let username = tokenUsername.get(token);

    if (token === undefined) {
        res.send({ "success": false, "reason": "token field missing" })
    }
    if (!tokenUsername.has(token)) {
        res.send({ "success": false, "reason": "Invalid token" })
    }
    if (contents === undefined) {
        res.send({ "success": false, "reason": "contents field missing" })
    }
    if (destination === undefined) {
        res.send({ "success": false, "reason": "destination field missing" })
    }
    if (!userToken.has(destination)) {
        res.send({ "success": false, "reason": "Destination user does not exist" })
    }

    chatMessages.set(username, []);
    let message = chatMessages.get(username);
    message.push({ "from": username, "contents": contents, "to": destination });
    res.send({ "success": true })
});



app.post("/chat-messages", (req, res) => {
    let token = req.header("token");


    let parsed = JSON.parse(req.body);
    let destination = parsed.destination;
    let username = tokenUsername.get(token);
    let messageHistory = new Array();
    //[{"from":"bob","contents":"hey"},{"from":"sue","contents":"hi"}]
    if (!tokenUsername.has(token)) {
        res.send({ "success": false, "reason": "Invalid token" })
    }
    if (destination === undefined) {
        res.send({ "success": false, "reason": "destination field missing" })
    }
    if (!userToken.has(destination)) {
        res.send({ "success": false, "reason": "Destination user not found" })
    }

    let usermsg = chatMessages.get(username);
    let destmsg = chatMessages.get(destination);

    for (let i = 0; i < usermsg.length; i++) {
        let destname = usermsg[i];
        let destuser = destmsg[i];
        if (destname.to === destination) {
            messageHistory.push({ "from": username, "contents": destname.contents });
        }
        if (destuser.to === username) {
            messageHistory.push({ "from": destuser.from, "contents": destuser.contents });
        }

    }

    messageHistory.set(username, messageHistory);
    res.send({ "success": true, })
})


app.listen(process.env.PORT || 3000);