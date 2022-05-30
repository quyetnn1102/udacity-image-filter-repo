import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles} from './util/util';
import { config } from './config/config';
const morgan = require('morgan');
import status from 'http-status';
import * as Sentry from '@sentry/node';
import { stringify } from 'querystring';
const valid_url = require('valid-url');

(async () => {

  Sentry.init({ dsn: config.sentry.dsn });

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  app.use(morgan(config.morgan.format));

  // @TODO1 IMPLEMENT A RESTFUL ENDPOINT
  // GET /imagefilter?image_url={{URL}}
  // endpoint to filter an image from a public url.
  // IT SHOULD
  //  1.1. Check the image_url query parameter
  //  1.2. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]

  /**************************************************************************** */
  app.get("/imagefilter", async ( req: Request, res: Response ) => {
    // Get request URL
    
    var reuqest_query  = req.query;
    console.log(reuqest_query)

    // 1.1 Check the image_url query parameter
    if ( !reuqest_query) {
      return res.status(status.BAD_REQUEST).send(status['HTTP_STATUS_400'] + " `image_url` query parameter is required.");
    }

    // 1.2 Validate the image_url query using valid_url lib
    if(!valid_url.isUri(reuqest_query.image_url)) {
      return res.status(status.BAD_REQUEST).send(status['HTTP_STATUS_400'] + " `image_url` is not a valid url.");
    }

    // 2. Call filterImageFromURL(image_url) to filter the image
    filterImageFromURL(String(reuqest_query.image_url)).then(filtered_image_url => {
      // 3. Send the resulting file in the response
      res.status(200).sendFile(filtered_image_url, () => {
        // 4. Deletes any files on the server on finish of the response
        deleteLocalFiles([filtered_image_url]);
      });
    }).catch((e) => {
      return res.status(status.UNPROCESSABLE_ENTITY).send(status['HTTP_STATUS_422'] + ' `image_url` is unreachable : ' + reuqest_query);
    });

  });
  //! END @TODO1
  
  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    res.send("try GET /imagefilter?image_url={{}}")
  } );
  

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();