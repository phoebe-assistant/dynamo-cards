
var AWS = require("aws-sdk");
AWS.config.update({region: "us-east-1"});
const tableName = "FlashiestCard"; //change to your Dynamodb table name

var dbHelper = function () { };
var docClient = new AWS.DynamoDB.DocumentClient();

dbHelper.prototype.addCard = (answer, card, userID) => {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: tableName,
            // adjust these to your db table
            Item: {
              'cardContent' : answer,
              'cardTitle' : card,
              'userId': userID
            }
        };
        docClient.put(params, (err, data) => {
            if (err) {
                console.log("Unable to insert =>", JSON.stringify(err))
                return reject("Unable to insert");
            }
            console.log("Saved Data, ", JSON.stringify(data));
            resolve(data);
        });
    });
}

dbHelper.prototype.getCards = (userID) => {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: tableName,
            KeyConditionExpression: "#userID = :user_id",
            ExpressionAttributeNames: {
                "#userID": "userId"
            },
            ExpressionAttributeValues: {
                ":user_id": userID,
            }
        }
        docClient.query(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            } 
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            resolve(data.Items)
            
        })
    });
}

dbHelper.prototype.removeCard = (card, userID) => {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: tableName,
            // adjust for your dbtable
            Key: {
                "cardTitle": card,
                "userId": userID
            }
        }
        docClient.delete(params, function (err, data) {
            if (err) {
                console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            }
            console.log(JSON.stringify(err));
            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
            resolve()
        })
    });
}

module.exports = new dbHelper();
