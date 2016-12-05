var mysql = require('../utils/dao');
var properties = require('properties-reader')('properties.properties');
var logger = require('../utils/logger');
var cache = require('../utils/cache');
var mongo = require('mongodb');
var monk = require('monk');
var bcrypt = require('bcrypt');
var db = monk(properties.get('paths.mongoDBHosting')); // TODO: Fetch Properties like URL from Properties File on load!

module.exports = {
		fetch_profile : function(msg, callback) {
			cache.fetchItem('profile_profile', msg.payload, (userID, processItem) => {
				mysql.executeQuery('select account_details.user_id as user_id, f_name, l_name, email, active, phone, gender, month, day, year, city, state, description from account_details left join profile_details on account_details.user_id = profile_details.user_id where account_details.user_id = ?', [ userID ], (error, profile_details) => {
					processItem(profile_details);
				});
			}, (result) => {
				//console.log("fetch_profile", result);
				callback(null, result);
			});
			/*mysql.executeQuery('select account_details.user_id as user_id, f_name, l_name, email, active, phone, gender, month, day, year, city, state, description from account_details left join profile_details on account_details.user_id = profile_details.user_id where account_details.user_id = ?', [ msg.payload ], (error, profile_details) => {
				callback(error, profile_details);
			});*/
		},
		
		fetch_card_details : function(msg, callback) {
			cache.fetchItem('profile_cards', msg.payload, (userID, processItem) => {
				mysql.executeQuery('select card_id, card_number, exp_month,exp_year,cvv,first_name,last_name,postal_code,country from card_details where user_id = ?', [ userID ], (error, card_details) => {
					processItem(card_details);
				});
			}, (result) => {
				//console.log("fetch_card_details", result);
				callback(null, result);
			});
			/*mysql.executeQuery('select card_id, card_number, exp_month,exp_year,cvv,first_name,last_name,postal_code,country from card_details where user_id = ?', [ msg.payload ], (error, card_details) => {
				callback(error, card_details);
			});*/
		},
		fetch_login_history : function(msg, callback) {
			cache.fetchItem('profile_login_history', msg.payload, (userID, processItem) => {
				mysql.executeQuery('select timestamp, user_agent from login_history where user_id = ?', [ userID ], (error, login_history) => {
					processItem(login_history);
				});
			}, (result) => {
				//console.log("fetch_login_history", result);
				callback(null, result);
			});
			/*mysql.executeQuery('select account_details.user_id as user_id, f_name, l_name, email, active, phone, gender, month, day, year, city, state, description from account_details left join profile_details on account_details.user_id = profile_details.user_id where account_details.user_id = ?', [ msg.payload ], (error, profile_details) => {
				callback(error, profile_details);
			});*/
		},
		fetch_properties : function(msg, callback) {
			cache.fetchItem('profile_properties', msg.payload, (userID, processItem) => {
				mysql.executeQuery('select property_id, house_rules, longitude, latitude, st_address, apt, city, state, zip, active, property_type from property_details inner join property_types on property_details.property_type_id = property_types.property_type_id where owner_id = ?', [ userID ], (error, property_details) => {
					if (error) {
						throw error;
					} else {
						if(property_details.length === 0) {
							callback(null, property_details);
						}
						property_details.forEach(function(item, index, array) {
							db.get('property_photos').find({
								'property_id' : item.property_id
							}).then((photos) => {
								property_details[index].photos = photos;
								if(index === array.length - 1) {
									callback(null, property_details);
								}
							});
						});
					}
				});
			}, (result) => {
				//console.log("profile_properties",result);
				callback(null, result);
			});
			/*mysql.executeQuery('select property_id, house_rules, longitude, latitude, st_address, apt, city, state, zip, active, property_type from property_details inner join property_types on property_details.property_type_id = property_types.property_type_id where owner_id = ?', [ msg.payload ], (error, property_details) => {
				if(property_details.length === 0) {
					callback(error, property_details);
				}
				property_details.forEach(function(item, index, array) {
					db.get('property_photos').find({
						'property_id' : item.property_id
					}).then((photos) => {
						property_details[index].photos = photos;
						if(index === array.length - 1) {
							callback(error, property_details);
						}
					});
				});
			});*/
		},
		fetch_listings : function(msg, callback) {
			cache.fetchItem('profile_listings', msg.payload, (userID, processItem) => {
				mysql.executeQuery('select listing_id, listings.property_id, title, is_bid, start_date, end_date, daily_price, listings.active as listing_active, property_details.active as property_active, room_type from listings inner join property_details on listings.property_id = property_details.property_id inner join room_types on listings.room_type_id = room_types.room_type_id where property_details.owner_id = ?', [ msg.payload ], (error, listing_details) => {
					processItem(listing_details);
				});
			}, (result) => {
				//console.log("profile_listings",result);
				callback(null, result);
			});
			/*mysql.executeQuery('select listing_id, listings.property_id, title, is_bid, start_date, end_date, daily_price, listings.active as listing_active, property_details.active as property_active, room_type from listings inner join property_details on listings.property_id = property_details.property_id inner join room_types on listings.room_type_id = room_types.room_type_id where property_details.owner_id = ?', [ msg.payload ], (error, listing_details) => {
				callback(error, listing_details);
			});*/
		},
		fetch_trips : function(msg, callback) {
			cache.fetchItem('profile_trips', msg.payload, (userID, processItem) => {
				mysql.executeQuery('select trip_details.trip_id, title, st_address, city, state, zip, longitude, latitude, checkin, checkout, trip_amount, host_rating, host_review, receipt_id from trip_details inner join listings on listings.listing_id = trip_details.listing_id inner join property_details on listings.property_id = property_details.property_id left join ratings on ratings.trip_id = trip_details.trip_id left join bill_details on bill_details.trip_id = trip_details.trip_id where user_id = ?', [ msg.payload ], (error, trip_details) => {
					if (error) {
						throw error;
					} else {
						if(trip_details.length === 0) {
							callback(null, trip_details);
						}
						trip_details.forEach(function(item, index, array) {
							db.get('host_review_photos').find({
								'trip_id' : item.trip_id
							}).then(function(docs) {
								if(docs && docs.length > 0) {
									trip_details[index].review_photos = docs[0].photos;
								}
								if(trip_details.length == index + 1) {
									processItem(trip_details);
								}
							})
						});
					}
				});
			}, (result) => {
				//console.log("profile_trips",result);
				callback(null, result);
			});
			/*mysql.executeQuery('select trip_details.trip_id, title, st_address, city, state, zip, longitude, latitude, checkin, checkout, trip_amount, host_rating, host_review, receipt_id from trip_details inner join listings on listings.listing_id = trip_details.listing_id inner join property_details on listings.property_id = property_details.property_id left join ratings on ratings.trip_id = trip_details.trip_id left join bill_details on bill_details.trip_id = trip_details.trip_id where user_id = ?', [ msg.payload ], (error, trip_details) => {
				if(trip_details.length === 0) {
					callback(error, trip_details);
				}
				trip_details.forEach(function(item, index, array) {
					db.get('host_review_photos').find({
						'trip_id' : item.trip_id
					}).then(function(docs) {
						if(docs && docs.length > 0) {
							trip_details[index].review_photos = docs[0].photos;
						}
						if(trip_details.length == index + 1) {
							callback(error, trip_details);
						}
					})
				});
			});*/
		},
		fetch_hostings : function(msg, callback) {
			cache.fetchItem('profile_hostings', msg.payload, (userID, processItem) => {
				mysql.executeQuery('select trip_details.trip_id, f_name, l_name, st_address, city, state, zip, checkin, checkout, no_of_guests, traveller_rating, traveller_review from account_details inner join property_details on account_details.user_id = property_details.owner_id inner join listings on listings.property_id = property_details.property_id inner join trip_details on listings.listing_id = trip_details.listing_id left join ratings on ratings.trip_id = trip_details.trip_id where account_details.user_id = ?', [ msg.payload ], (error, hosting_details) => {
					if (error) {
						throw error;
					} else {
						if(hosting_details.length === 0) {
							callback(null, hosting_details);
						}
						hosting_details.forEach(function(item, index, array) {
							db.get('traveller_review_photos').find({
								'trip_id' : item.trip_id
							}).then(function(docs) {
								hosting_details[index].review_photos = docs.photos
								if(hosting_details.length == index + 1) {
									processItem(hosting_details);
								}
							})
						});
					}
				});
			}, (result) => {
				//console.log("profile_hostings",result);
				callback(null, result);
			});
			/*mysql.executeQuery('select trip_details.trip_id, f_name, l_name, st_address, city, state, zip, checkin, checkout, no_of_guests, traveller_rating, traveller_review from account_details inner join property_details on account_details.user_id = property_details.owner_id inner join listings on listings.property_id = property_details.property_id inner join trip_details on listings.listing_id = trip_details.listing_id left join ratings on ratings.trip_id = trip_details.trip_id where account_details.user_id = ?', [ msg.payload ], (error, hosting_details) => {
				if(hosting_details.length === 0) {
					callback(error, hosting_details);
				}
				hosting_details.forEach(function(item, index, array) {
					db.get('traveller_review_photos').find({
						'trip_id' : item.trip_id
					}).then(function(docs) {
						hosting_details[index].review_photos = docs.photos
						if(hosting_details.length == index + 1) {
							callback(error, hosting_details);
						}
					})
				});
			});*/
		},
		fetch_user_photo : function(msg, callback) {
			cache.fetchItem('profile_user_photo', msg.payload, (userID, processItem) => {
				db.get('user_photos').findOne({
					'user_id' : msg.payload
				}).then((photo) => {
					if (photo) {
						processItem(photo.photo);
					} else {
						processItem([]);
					}
				});
			}, (result) => {
//				//console.log("profile_user_photo",result);
				callback(null, result);
			});
			/*db.get('user_photos').findOne({
				'user_id' : msg.payload
			}).then((photo) => {
				if (photo) {
					callback(null, photo.photo);
				} else {
					callback(null, []);
				}
			});*/
		},
		fetch_user_video : function(msg, callback) {
			cache.fetchItem('profile_user_video', msg.payload, (userID, processItem) => {
				db.get('user_videos').findOne({
					'user_id' : msg.payload
				}).then((video) => {
					if (video) {
						processItem(video.video);
					} else {
						processItem([]);
					}
				});
			}, (result) => {
//				//console.log("profile_user_video",result);
				callback(null, result);
			});
			/*db.get('user_videos').findOne({
				'user_id' : msg.payload
			}).then((video) => {
				if (video) {
					callback(null, video.video);
				} else {
					callback(null, []);
				}
			});*/
		},
		fetch_host_rating_details : function(msg, callback) {
			cache.fetchItem('profile_host_rating', msg.payload, (userID, processItem) => {
				mysql.executeQuery('select owner_id as user_id, avg(host_rating) as host_rating from ratings right join trip_details on ratings.trip_id = trip_details.trip_id inner join listings on listings.listing_id = trip_details.listing_id inner join property_details on listings.property_id = property_details.property_id where owner_id = ?', [ msg.payload ], (error, hosting_rating_details) => {
					if (error) {
						throw error;
					} else {
						processItem(hosting_rating_details);
					}
				});
			}, (result) => {
				//console.log("profile_host_rating",result);
				callback(null, result);
			});
			/*mysql.executeQuery('select owner_id as user_id, avg(host_rating) as host_rating from ratings right join trip_details on ratings.trip_id = trip_details.trip_id inner join listings on listings.listing_id = trip_details.listing_id inner join property_details on listings.property_id = property_details.property_id where owner_id = ?', [ msg.payload ], (error, hosting_rating_details) => {
				callback(error, hosting_rating_details);
			});*/
		},
		fetch_traveller_rating_details : function(msg, callback) {
			cache.fetchItem('profile_traveller_rating', msg.payload, (userID, processItem) => {
				mysql.executeQuery('select user_id as user_id, avg(traveller_rating) as traveller_rating from ratings right join trip_details on ratings.trip_id = trip_details.trip_id where user_id = ?', [ msg.payload ], (error, travelling_rating_details) => {
					if (error) {
						throw error;
					} else {
						processItem(travelling_rating_details);
					}
				});
			}, (result) => {
				//console.log("profile_traveller_rating",result);
				callback(null, result);
			});
			/*mysql.executeQuery('select user_id as user_id, avg(traveller_rating) as traveller_rating from ratings right join trip_details on ratings.trip_id = trip_details.trip_id where user_id = ?', [ msg.payload ], (error, travelling_rating_details) => {
				callback(error, travelling_rating_details);
			});*/
		}
		
};