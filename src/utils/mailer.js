var AWS = require('aws-sdk');

const sendMail = (toAddress, subject, header, body) => {
	AWS.config.update({
	  accessKeyId: process.env.S3_ACCESS_KEY_ID,
	  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
	  region: process.env.S3_REGION    
	});

	var params = {
	  Destination: {
	    ToAddresses: [
	      `${toAddress}`,
	    ]
	  },
	  Message: {
	    Body: {
	      Html: {
	       Charset: "UTF-8",
	       Data: `${body}`
	      },
	      Text: {
	       Charset: "UTF-8",
	       Data: `${body}`
	      }
	     },
	     Subject: {
	      Charset: 'UTF-8',
	      Data: `${subject}`
	     }
	    },
	  Source: 'vimal.r.100@gmail.com',
	  ReplyToAddresses: [
	    'vimal.r.100@gmail.com',
	  ],
	};

var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();

return sendPromise.then(
  function(data) {
  	return {
  		status: 'success'
  	};
    
  }).catch(
    function(err) {
    	return {
    		status: 'failure'
    	};
  });
};

module.exports = sendMail;