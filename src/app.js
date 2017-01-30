/*jshint node: true*/
'use strict';

// Require Moment for date formatting
var moment = require('moment');
var Promise = require('promise');

// Initiate Express
var express = require('express');
var app = express();

// Set up pug, including location of templates
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');


// Set up location of static files
app.use(express.static(__dirname + '/public'));

// Set up Twitter client
var error = function (err, response, body) {
	console.log('ERROR [%s]', err);
};
var success = function (data) {
	console.log('Data [%s]', data);
};

var Twit = require('twit');
var config = require('./config.js');

var client = new Twit({
	consumer_key: config.consumer_key,
	consumer_secret: config.consumer_secret,
	access_token: config.access_token,
	access_token_secret: config.access_token_secret
});

// Set up server
app.listen(3000, function() {
	console.log("Magic is happening on port 3000!");
});


// Make calls to Twitter API using Twitter client
// 1. Get profile information
var promiseUsersShow = new Promise(function(resolve, reject) {
	client.get('users/show', {user_id: '4373581162'}, function(error, profile, response){

		if (error) {
			return reject(error);
		}

		var userdetailsjson = {
			username: profile.name,
			screenname: profile.screen_name,
			following: profile.friends_count,
			profileimage: profile.profile_image_url
		};

		resolve(userdetailsjson);
	});
});


// 2. Get five recent tweets
var promiseUserTimeline = new Promise(function(resolve, reject) {
	client.get('statuses/user_timeline', {user_id: '4373581162', count: '5'}, function(error, tweets, response){
		var usertweets = [];
		var usertweetsjson;

		if (error) {
			return reject(error);
		}

		for (var i=0; i<tweets.length; i++) {
  			usertweetsjson = {
				tweetcontent: tweets[i].text,
				retweets: tweets[i].retweet_count,
				likes: tweets[i].favorite_count,
				date: moment(tweets[i].created_at).format("MMM Do")
			};

			usertweets.push(usertweetsjson);
		}

	resolve(usertweets);
	});
});



// 3. Get five recent friends
var promiseFriendsList = new Promise(function(resolve, reject) {
	client.get('friends/list', {user_id: '4373581162', count: '5'}, function(error, friends, response){
		var recentfriends = [];
		var friendsjson;

		if (error) {
			return reject(error);
		}

		for (var j=0; j<friends.users.length; j++) {
			friendsjson = {
				friendname: friends.users[j].name,
				friendscreenname: friends.users[j].screen_name,
				friendimage: friends.users[j].profile_image_url
			};
			recentfriends.push(friendsjson);
		}

		resolve(recentfriends);
	});
});


// 4. Get five recent direct messages received
var promiseDirectMessages = new Promise(function(resolve, reject) {
	client.get('direct_messages', {user_id: '4373581162', count: '5'}, function(error, messages, response){
		var directmessages = [];
		var messagesjson;

		if (error) {
			return reject(error);
		}

		for (var k=0; k<messages.length; k++) {
			messagesjson = {
				messagetime: moment(messages[k].sender.created_at).format("MMM Do h:mm a"),
				messageprofilepic: messages[k].sender.profile_image_url,
				messagescreenname: messages[k].sender_screen_name,
				messagetext: messages[k].text,
				recipientmessagetime: messages[k].recipient.created_at,
				recipientprofilepic: messages[k].recipient.profile_image_url,
			};
			directmessages.push(messagesjson);
		}

 		resolve(directmessages);
	});
 });

// All these calls to API can run in parallel, then the results will be used to render the page
// So I will use the Promise.all approach
Promise.all([promiseUsersShow, promiseUserTimeline, promiseFriendsList, promiseDirectMessages])
	.then(function(results){

		// Put data into templates and render root
		app.get('/', function(req, res){
			res.render('index', {
			username: results[0].username,
			screenname: results[0].screenname,
			profileimage: results[0].profileimage,
			following: results[0].following,
			usertweets: results[1],
			recentfriends: results[2],
			directmessages: results[3],

			});
		});

	}).catch(function(error){
		console.log(error);
	});