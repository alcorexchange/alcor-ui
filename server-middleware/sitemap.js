import { SitemapStream, streamToPromise } from 'sitemap'

//  const { SitemapStream, streamToPromise } = require( 'sitemap' )
//  const { Readable } = require( 'stream' )
//
//  // An array with your links
//  const links = [{ url: '/page-1/',  changefreq: 'daily', priority: 0.3  }]
//
//  // Create a stream to write to
//  const stream = new SitemapStream( { hostname: 'https://...' } )
//
//  // Return a promise that resolves with your XML string
//  return streamToPromise(Readable.from(links).pipe(stream)).then((data) =>
//    data.toString()
//  )



export default function (req, res, next) {
  // req is the Node.js http request object
  console.log('req', req)

  res.setHeader('Content-Type', 'application/xml')
  res.end('ololol')

  // res is the Node.js http response object
  // asdf

  // next is a function to call to invoke the next middleware
  // Don't forget to call next at the end if your middleware is not an endpoint!
  next()
}
