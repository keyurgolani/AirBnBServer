var indexFile = require('../dbServices/index');

exports.handle_request = function(message, callback) {
    console.log("In handle_request "+ message.reqType);
    if(message.reqType === "addProperty"){
    	indexFile.addProperty(message, callback);
    } 
    if(message.reqType === "register"){
    	indexFile.register(message, callback);
    } 
    if(message.reqType === "fetchPropertyListings"){
    	indexFile.fetchPropertyListings(message, callback);
    } 
    if(message.reqType === "fetchListingDetails"){
    	indexFile.fetchListingDetails(message, callback);
    } 
};