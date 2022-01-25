const path = require ( 'path' );
const http = require ( 'http' );
const express = require ( 'express' );
const hbs = require ( 'express-handlebars' );
const app = express ();

const configService = require ( './services/config' );
global.config = require ( './settings/app.json' );

const terminal = require ( './services/terminal' ) ( config );
const token = require ( './services/token' ) ( config );
const assetRegisterService = require ( './services/asset-register' ) ( config );

app.engine ( 'handlebars', hbs (
    {
        defaultLayout: 'main',
        helpers      : {
            json: c => JSON.stringify ( c, null, 4 )
        }
    }
) );
app.set ( 'view engine', 'handlebars' );

// Index page
app.get ( '/', async ( req, res ) => {

    // Check asset register
    if ( config.enable_asset_register !== false ) {
        // Get asset register hosts
        const assetHostsGroup = await assetRegisterService.getHosts ();
        // Update hosts
        config.hosts[ 0 ] = {
            ...config.hosts[ 0 ],
            ...assetHostsGroup
        };
    }

    // Decorate updated configs
    if ( !global.config.decorated ) {
        global.config = configService.decorateAppConfig ( global.config );
    }

    // Serve the view
    return res.render ( 'index', {
        layout: false,
        config: config
    } );

} );

// Static files
app.use ( '/', express.static ( path.join ( __dirname, 'public' ) ) );

// Request new terminal
app.get ( '/open/:id', terminal );

// Generate token
app.get ( '/token/:id', token );

// Create server
http.createServer ( app )
    .listen ( config.app_port, function () {
        console.log ( 'App server listening on: http://localhost:' + config.app_port );
    } );